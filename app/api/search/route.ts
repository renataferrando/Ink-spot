import { z } from "zod";

import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getQueryEmbedding, getImageQueryEmbedding } from "@/lib/ai/search-query";
import { computeCurrentLocation } from "@/lib/location";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import type { ArtistPublic, ArtistWithScore } from "@/types/artist";

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

    const results = await enrichSearchRows((rows ?? []) as SearchRow[], admin);

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

  const results = await enrichSearchRows(scored, admin);

  return Response.json({
    results,
    processingMs: Date.now() - start,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fetch portfolio items for search result rows and assemble ArtistWithScore[].
async function enrichSearchRows(
  rows: SearchRow[],
  admin: ReturnType<typeof getSupabaseAdminClientUntyped>,
): Promise<ArtistWithScore[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  const { data: portfolioItems } = await admin
    .from("portfolio_items")
    .select(
      "id, artist_id, image_url, caption, alt_text, detected_styles, is_featured, sort_order, width, height",
    )
    .in("artist_id", ids)
    .order("sort_order", { ascending: true });

  const { data: locationRows } = await admin
    .from("artist_locations")
    .select("artist_id, lat, lng, location_name, kind, starts_at, ends_at, is_current, studio_name, notes, id")
    .in("artist_id", ids);

  const itemsByArtist = groupBy(
    (portfolioItems ?? []) as Record<string, unknown>[],
    "artist_id",
  );
  const locationsByArtist = groupBy(
    (locationRows ?? []) as Record<string, unknown>[],
    "artist_id",
  );

  const now = Date.now();

  return rows.map((row) => {
    const items = itemsByArtist[row.id] ?? [];
    const locs = locationsByArtist[row.id] ?? [];
    const current = computeCurrentLocation(locs);
    const upcoming = locs
      .filter((l) => {
        if (l.id === current?.id) return false;
        const start = l.starts_at as string | null;
        return start && new Date(start).getTime() > now;
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at as string).getTime() -
          new Date(b.starts_at as string).getTime(),
      );

    const artist: ArtistPublic = {
      id: row.id,
      handle: row.handle,
      display_name: row.display_name,
      bio: null,
      profile_image_url: row.profile_image_url,
      cover_image_url: null,
      instagram_handle: null,
      website_url: null,
      contact_email: null,
      years_experience: null,
      primary_styles: row.primary_styles as ArtistPublic["primary_styles"],
      style_description: null,
      is_demo: false,
      is_claimed: false,
      is_active: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current_location: current as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upcoming_locations: upcoming as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      portfolio_items: items as any,
      created_at: "",
      updated_at: "",
    };

    return {
      ...artist,
      distance_km: row.distance_km ?? undefined,
      style_similarity: row.style_similarity ?? undefined,
      combined_score: row.combined_score,
    };
  });
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    (result[k] ??= []).push(item);
  }
  return result;
}

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as number[];
    } catch {
      return null;
    }
  }
  return null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
