import { z } from "zod";

import type { ArtistPublic } from "@/types/artist";
import { ARTIST_WITH_RELATIONS_SELECT, mapArtistRow } from "@/lib/data/artist-queries";

export const revalidate = 60;

const QuerySchema = z.object({
  styles: z.string().optional(),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

function buildResponse(artists: ArtistPublic[], total: number, limit: number, offset: number) {
  return Response.json({
    artists,
    total,
    hasMore: offset + artists.length < total,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return Response.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const { styles, q, limit, offset } = parsed.data;
  const styleList = styles ? styles.split(",").filter(Boolean) : [];

  // ── Try Supabase ─────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options ?? {}),
          );
        },
      },
    });

    // Fetch artists joined with all locations + portfolio items
    let query = supabase
      .from("artists")
      .select(ARTIST_WITH_RELATIONS_SELECT, { count: "exact" })
      .eq("is_active", true)
      .range(offset, offset + limit - 1);

    if (styleList.length > 0) {
      query = query.overlaps("primary_styles", styleList);
    }

    if (q) {
      query = query.ilike("display_name", `%${q}%`);
    }

    const { data, error, count } = await query.returns<Record<string, unknown>[]>();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (data) {
      // Reshape into ArtistPublic (split artist_locations → current + upcoming)
      const artists: ArtistPublic[] = data.map((row) => mapArtistRow(row));
      return buildResponse(artists, count ?? artists.length, limit, offset);
    }
  }

  return Response.json({ error: "Supabase is not configured" }, { status: 503 });
}
