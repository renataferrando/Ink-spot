import { z } from "zod";

import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getQueryEmbedding } from "@/lib/ai/search-query";
import { streamSearchAssistant } from "@/lib/ai/features/assistant";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { enrichArtistRows, groupBy, parseEmbedding, cosineSimilarity } from "@/lib/ai/search-utils";

export const runtime = "nodejs";

const RequestSchema = z.object({
  text: z.string().min(1).max(500),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

type SearchRow = {
  id: string;
  handle: string;
  display_name: string;
  profile_image_url: string | null;
  location_name: string | null;
  primary_styles: string[];
  distance_km: number | null;
  style_similarity: number | null;
  combined_score: number;
};

export async function POST(request: Request) {
  const limited = await rateLimit("search-assistant", getClientIp(request));
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const { text, lat, lng } = parsed.data;
  const admin = getSupabaseAdminClientUntyped();

  // ── Get embedding ──────────────────────────────────────────────────────────
  let embedding: number[];
  try {
    embedding = await getQueryEmbedding(text);
  } catch (err) {
    console.error("[api/ai/search-assistant] embedding error:", (err as Error).message);
    return new Response(`Embedding failed: ${(err as Error).message}`, { status: 502 });
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  let searchRows: SearchRow[] = [];
  if (lat !== undefined && lng !== undefined) {
    const { data } = await admin.rpc("search_artists", {
      query_embedding: JSON.stringify(embedding),
      user_lat: lat,
      user_lng: lng,
      max_distance_km: 200,
      style_weight: 0.6,
      limit_count: 5,
    });
    searchRows = (data ?? []) as SearchRow[];
  } else {
    const { data: artists } = await admin
      .from("artists")
      .select(
        `id, handle, display_name, profile_image_url,
         primary_styles, style_embedding,
         artist_locations(location_name, is_current)`,
      )
      .eq("is_active", true)
      .not("style_embedding", "is", null)
      .limit(200);

    type ArtistRow = {
      id: string;
      handle: string;
      display_name: string;
      profile_image_url: string | null;
      primary_styles: string[];
      style_embedding: unknown;
      artist_locations: { location_name: string; is_current: boolean }[];
    };

    searchRows = ((artists ?? []) as ArtistRow[])
      .reduce<SearchRow[]>((acc, a) => {
        const vec = parseEmbedding(a.style_embedding);
        if (!vec) return acc;
        const sim = cosineSimilarity(embedding, vec);
        const loc = a.artist_locations?.find((l) => l.is_current);
        acc.push({
          id: a.id,
          handle: a.handle,
          display_name: a.display_name,
          profile_image_url: a.profile_image_url,
          location_name: loc?.location_name ?? null,
          primary_styles: a.primary_styles ?? [],
          distance_km: null,
          style_similarity: sim,
          combined_score: sim,
        });
        return acc;
      }, [])
      .sort((a, b) => b.combined_score - a.combined_score)
      .slice(0, 5);
  }

  // ── Enrich results ─────────────────────────────────────────────────────────
  const results = await enrichArtistRows(searchRows, admin);

  // ── Stream SSE ────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const explanationStream = await streamSearchAssistant(
    text,
    searchRows.map((r) => ({
      display_name: r.display_name,
      primary_styles: r.primary_styles,
      location_name: r.location_name,
      match_score: r.combined_score,
    })),
  );

  const body2 = new ReadableStream<Uint8Array>({
    async start(controller) {
      // First: emit the results so the client can render cards immediately
      const resultsEvent = `data: ${JSON.stringify({ type: "results", artists: results })}\n\n`;
      controller.enqueue(encoder.encode(resultsEvent));

      // Then: pipe the token stream
      const reader = explanationStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(body2, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

