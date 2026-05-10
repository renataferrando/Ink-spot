import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ArtistPublic } from "@/types/artist";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("artists")
      .select(`
        id, handle, display_name, bio,
        instagram_handle, profile_image_url, cover_image_url,
        website_url, contact_email, years_experience,
        primary_styles, style_description,
        is_demo, is_claimed, is_active,
        created_at, updated_at,
        artist_locations(
          id, artist_id, lat, lng, location_name,
          kind, starts_at, ends_at, is_current, studio_name, notes
        ),
        portfolio_items(
          id, artist_id, image_url, caption, alt_text,
          detected_styles, is_featured, sort_order, width, height
        )
      `)
      .eq("handle", id) // id param is the handle
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return Response.json({ error: "Artist not found" }, { status: 404 });
    }

    const row = data as Record<string, unknown>;
    const locs = Array.isArray(row.artist_locations) ? row.artist_locations : [];
    const current = locs.find((l: Record<string, unknown>) => l.is_current) ?? locs[0] ?? null;

    const artist: ArtistPublic = {
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
      portfolio_items: (Array.isArray(row.portfolio_items) ? row.portfolio_items : []) as ArtistPublic["portfolio_items"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    return Response.json({ artist });
  } catch {
    return Response.json({ error: "Supabase not configured" }, { status: 503 });
  }
}
