import { z } from "zod";

import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getQueryEmbedding, getImageQueryEmbedding } from "@/lib/ai/search-query";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { enrichArtistRows, parseEmbedding, cosineSimilarity } from "@/lib/ai/search-utils";

export const runtime = "nodejs";

const SearchRequestSchema = z.object({
  text: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  mode: z.enum(["text", "image", "combined"]).default("text"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  styles: z.array(z.string()).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
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
  const limited = await rateLimit("search", getClientIp(request));
  if (limited) return limited;

  const start = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SearchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }

  const { text, imageUrl, lat, lng, limit } = parsed.data;

  if (!text && !imageUrl) {
    return Response.json({ error: "Provide text or imageUrl" }, { status: 400 });
  }

  // ── Get query embedding ────────────────────────────────────────────────────
  let embedding: number[];
  try {
    if (imageUrl) {
      embedding = await getImageQueryEmbedding(imageUrl);
    } else {
      embedding = await getQueryEmbedding(text!);
    }
  } catch (err) {
    console.error("[api/search] embedding error:", err);
    return Response.json({ error: "Failed to generate search embedding" }, { status: 502 });
  }

  const admin = getSupabaseAdminClientUntyped();

  // ── Semantic search when lat/lng provided ─────────────────────────────────
  if (lat !== undefined && lng !== undefined) {
    const { data: rows, error } = await admin.rpc("search_artists", {
      query_embedding: JSON.stringify(embedding),
      user_lat: lat,
      user_lng: lng,
      max_distance_km: 200,
      style_weight: 0.6,
      limit_count: limit,
    });

    if (error) {
      console.error("[api/search] search_artists RPC error:", error.message);
      return Response.json({ error: "Search failed" }, { status: 500 });
    }

    const results = await enrichArtistRows((rows ?? []) as SearchRow[], admin);

    return Response.json({
      results,
      processingMs: Date.now() - start,
    });
  }

  // ── Style-only search (no geo) — cosine similarity in-process ─────────────
  // When no coordinates are provided, fetch artists with embeddings and rank by
  // style similarity alone. Used for non-location-aware searches.
  const { data: artists, error: listError } = await admin
    .from("artists")
    .select(
      `id, handle, display_name, profile_image_url,
       primary_styles, style_embedding,
       artist_locations(location_name, is_current)`,
    )
    .eq("is_active", true)
    .not("style_embedding", "is", null)
    .limit(200);

  if (listError) {
    console.error("[api/search] list error:", listError.message);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }

  type ArtistRow = {
    id: string;
    handle: string;
    display_name: string;
    profile_image_url: string | null;
    primary_styles: string[];
    style_embedding: unknown;
    artist_locations: { location_name: string; is_current: boolean }[];
  };

  const scored: SearchRow[] = ((artists ?? []) as ArtistRow[])
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
    .slice(0, limit);

  const results = await enrichArtistRows(scored, admin);

  return Response.json({
    results,
    processingMs: Date.now() - start,
  });
}

