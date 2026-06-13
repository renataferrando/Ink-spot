import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { computeCurrentLocation } from "@/lib/location";
import type { ArtistPublic, ArtistWithScore } from "@/types/artist";

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

export async function enrichArtistRows(
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
    .select(
      "artist_id, lat, lng, location_name, kind, starts_at, ends_at, is_current, studio_name, notes, id",
    )
    .in("artist_id", ids);

  const itemsByArtist = groupBy((portfolioItems ?? []) as Record<string, unknown>[], "artist_id");
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
          new Date(a.starts_at as string).getTime() - new Date(b.starts_at as string).getTime(),
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

export function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    (result[k] ??= []).push(item);
  }
  return result;
}

export function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p as number[];
    } catch {
      return null;
    }
  }
  return null;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
