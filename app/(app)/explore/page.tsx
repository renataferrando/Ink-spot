import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ArtistCard } from "@/components/artist/artist-card";
import { ArtistCardSkeleton } from "@/components/artist/artist-card-skeleton";
import { MapContainer } from "@/components/map/map-container";
import { STYLE_LABELS, type ArtistPublic, type ArtistStyle } from "@/types/artist";

export const metadata: Metadata = { title: "Explore" };

const FILTER_CHIPS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Blackwork", value: "blackwork" },
  { label: "Fine line", value: "fine-line" },
  { label: "Realism", value: "realism" },
  { label: "Watercolor", value: "watercolor" },
  { label: "Geometric", value: "geometric" },
  { label: "Japanese", value: "japanese" },
  { label: "Traditional", value: "traditional" },
];

async function getArtists(styles?: string): Promise<ArtistPublic[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured");
  }

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

  const baseQuery = supabase
    .from("artists")
    .select(
      `
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
    `,
    )
    .eq("is_active", true)
    .limit(40);

  const { data, error } = await (styles
    ? baseQuery.overlaps("primary_styles", [styles])
    : baseQuery);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const locs = Array.isArray(row.artist_locations) ? row.artist_locations : [];
    const current = locs.find((l: Record<string, unknown>) => l.is_current) ?? locs[0] ?? null;
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
      portfolio_items: (Array.isArray(row.portfolio_items)
        ? row.portfolio_items
        : []) as ArtistPublic["portfolio_items"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    } satisfies ArtistPublic;
  });
}

type Props = { searchParams: Promise<{ styles?: string }> };

export default async function ExplorePage({ searchParams }: Props) {
  const { styles } = await searchParams;
  const artists = await getArtists(styles);
  const locationLabel = artists[0]?.current_location?.location_name ?? "Santa Teresa";
  const activeStyle = styles ?? null;

  const styleLabel = activeStyle ? STYLE_LABELS[activeStyle as ArtistStyle] : null;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col">
      {/* Map */}
      <div className="h-[42vh] min-h-48 w-full shrink-0">
        <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
          <MapContainer artists={artists} />
        </Suspense>
      </div>

      {/* Style filter chip rail */}
      <div className="filter-bar mt-4">
        {FILTER_CHIPS.map(({ label, value }) => {
          const isActive = value === activeStyle || (value === null && !activeStyle);
          const href = value ? `/explore?styles=${value}` : "/explore";
          return (
            <Link
              key={label}
              href={href}
              className={`chip${isActive ? " active" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Section header — design's title + count */}
      <div className="section-head">
        <h2 className="title">
          {styleLabel ? (
            <em>{styleLabel}</em>
          ) : (
            <>
              Within <em>50&nbsp;km</em>
            </>
          )}
        </h2>
        <span className="count">
          {artists.length} ARTIST{artists.length !== 1 ? "S" : ""}
          {styleLabel ? "" : ` · ${locationLabel.toUpperCase()}`}
        </span>
      </div>

      {/* Artist list — flush stack with hairline dividers */}
      <div className="flex flex-col pb-24">
        <Suspense
          fallback={
            <>
              <ArtistCardSkeleton />
              <ArtistCardSkeleton />
              <ArtistCardSkeleton />
            </>
          }
        >
          {artists.length === 0 ? (
            <p className="text-muted-foreground px-[18px] py-12 text-center text-sm">
              No studios found for this style yet.
            </p>
          ) : (
            artists.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} priority={i < 2} />
            ))
          )}
        </Suspense>
      </div>
    </div>
  );
}
