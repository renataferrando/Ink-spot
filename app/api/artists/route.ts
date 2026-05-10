import { z } from "zod";

import type { ArtistPublic } from "@/types/artist";

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

    // Fetch artists joined with current location + portfolio items
    let query = supabase
      .from("artists")
      .select(
        `
        id, handle, display_name, bio,
        instagram_handle, profile_image_url, cover_image_url,
        website_url, contact_email, years_experience,
        primary_styles, style_description,
        is_demo, is_claimed, is_active,
        created_at, updated_at,
        artist_locations!inner(
          id, artist_id, lat, lng, location_name,
          kind, starts_at, ends_at, is_current,
          studio_name, notes
        ),
        portfolio_items(
          id, artist_id, image_url, caption, alt_text,
          detected_styles, is_featured, sort_order,
          width, height
        )
      `,
      )
      .eq("is_active", true)
      .eq("artist_locations.is_current", true)
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
      // Reshape into ArtistPublic (flatten artist_locations → current_location)
      const artists: ArtistPublic[] = data.map((row) => {
        const locs = Array.isArray(row.artist_locations) ? row.artist_locations : [];
        const current = locs.find((l: Record<string, unknown>) => l.is_current) ?? locs[0] ?? null;
        const items = Array.isArray(row.portfolio_items) ? row.portfolio_items : [];
        return {
          id: row.id as string,
          handle: row.handle as string,
          display_name: row.display_name as string,
          bio: row.bio as string | null,
          current_location: current as ArtistPublic["current_location"],
          instagram_handle: row.instagram_handle as string | null,
          profile_image_url: row.profile_image_url as string | null,
          cover_image_url: row.cover_image_url as string | null,
          website_url: row.website_url as string | null,
          contact_email: row.contact_email as string | null,
          years_experience: row.years_experience as number | null,
          primary_styles: (row.primary_styles ?? []) as ArtistPublic["primary_styles"],
          style_description: row.style_description as string | null,
          is_demo: row.is_demo as boolean,
          is_claimed: row.is_claimed as boolean,
          is_active: row.is_active as boolean,
          portfolio_items: items as ArtistPublic["portfolio_items"],
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
        };
      });

      return buildResponse(artists, count ?? artists.length, limit, offset);
    }
  }

  return Response.json({ error: "Supabase is not configured" }, { status: 503 });
}
