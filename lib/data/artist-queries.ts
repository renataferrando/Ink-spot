import { computeCurrentLocation, computeNextLocation } from "@/lib/location";
import type { ArtistPublic } from "@/types/artist";

/** Shared select clause for artist + locations + portfolio, used by every artist listing/detail query. */
export const ARTIST_WITH_RELATIONS_SELECT = `
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
`;

/** Reshapes a raw row (selected with ARTIST_WITH_RELATIONS_SELECT) into ArtistPublic. */
export function mapArtistRow(row: Record<string, unknown>): ArtistPublic {
  const locs = Array.isArray(row.artist_locations)
    ? (row.artist_locations as Record<string, unknown>[])
    : [];
  const current = computeCurrentLocation(locs);
  const next = computeNextLocation(locs, current);
  const now = Date.now();
  const upcoming = locs
    .filter((l) => {
      if (l.id === current?.id) return false;
      const start = l.starts_at as string | null | undefined;
      return Boolean(start) && new Date(start as string).getTime() > now;
    })
    .sort(
      (a, b) =>
        new Date(a.starts_at as string).getTime() - new Date(b.starts_at as string).getTime(),
    ) as unknown as ArtistPublic["upcoming_locations"];

  return {
    id: row.id as string,
    handle: row.handle as string,
    display_name: row.display_name as string,
    bio: row.bio as string | null,
    current_location: current as ArtistPublic["current_location"],
    upcoming_locations: upcoming,
    next_location: next
      ? {
          location_name: next.location.location_name,
          kind: next.location.kind,
          starts_at: next.starts_at,
          ends_at: next.location.kind === "home_base" ? null : next.location.ends_at ?? null,
          studio_name: next.location.studio_name ?? null,
        }
      : null,
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
    portfolio_items: (Array.isArray(row.portfolio_items)
      ? row.portfolio_items
      : []) as ArtistPublic["portfolio_items"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } satisfies ArtistPublic;
}
