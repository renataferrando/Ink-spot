import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ArtistCard } from "@/components/artist/artist-card";
import { ArtistCardSkeleton } from "@/components/artist/artist-card-skeleton";
import { ArtistRowDesktop } from "@/components/artist/artist-row-desktop";
import { MapContainer } from "@/components/map/map-container";
import { cn } from "@/lib/utils";
import { STYLE_LABELS, type ArtistPublic, type ArtistStyle } from "@/types/artist";
import {
  chipClass,
  chipActiveClass,
  filterBarClass,
  pageColumnClass,
  pageGutterClass,
  sectionHeadClass,
  sectionTitleClass,
  sectionCountClass,
} from "@/lib/ui/classes";

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
    const now = Date.now();
    const current = locs.find((l: Record<string, unknown>) => l.is_current) ?? locs[0] ?? null;
    const upcoming = locs
      .filter((l: Record<string, unknown>) => {
        if (l.is_current) return false;
        const start = l.starts_at as string | null | undefined;
        if (!start) return false;
        return new Date(start).getTime() > now;
      })
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          new Date(a.starts_at as string).getTime() - new Date(b.starts_at as string).getTime(),
      ) as ArtistPublic["upcoming_locations"];
    return {
      id: row.id as string,
      handle: row.handle as string,
      display_name: row.display_name as string,
      bio: row.bio as string | null,
      current_location: current as ArtistPublic["current_location"],
      upcoming_locations: upcoming,
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
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
        <div className={cn(pageColumnClass, pageGutterClass, "lg:pb-10")}>
          {/* Map */}
          <div className="lg:border-hairline h-[42vh] min-h-48 w-full shrink-0 overflow-hidden lg:h-[360px] lg:min-h-0 lg:rounded-[14px] lg:border">
            <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
              <MapContainer artists={artists} />
            </Suspense>
          </div>

          {/* Style filter chip rail */}
          <div className={cn(filterBarClass, "mt-4 max-w-full")}>
            {FILTER_CHIPS.map(({ label, value }) => {
              const isActive = value === activeStyle || (value === null && !activeStyle);
              const href = value ? `/explore?styles=${value}` : "/explore";
              return (
                <Link key={label} href={href} className={isActive ? chipActiveClass : chipClass}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Section header — design's title + count */}
          <div className={sectionHeadClass}>
            <h2 className={cn(sectionTitleClass, "text-[clamp(26px,2.6vw,34px)] leading-[1.1] tracking-[-0.03em]")}>
              {styleLabel ? (
                <em className="not-italic text-ink-spot">{styleLabel}</em>
              ) : (
                <>
                  Within <em className="not-italic text-ink-spot">50&nbsp;km</em>
                </>
              )}
            </h2>
            <span className={sectionCountClass}>
              {artists.length} ARTIST{artists.length !== 1 ? "S" : ""}
              {styleLabel ? "" : ` · ${locationLabel.toUpperCase()}`}
            </span>
          </div>

          {/* Artist list — mobile cards / desktop dt rows */}
          <div className="lg:border-hairline flex flex-col pb-24 lg:mt-2 lg:border-t lg:pt-[18px] lg:pb-0">
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
                <p className="text-muted-foreground py-12 text-center text-sm">
                  No studios found for this style yet.
                </p>
              ) : (
                artists.map((artist, i) => (
                  <div key={artist.id}>
                    <div className="lg:hidden">
                      <ArtistCard artist={artist} priority={i < 2} />
                    </div>
                    <div className="hidden lg:block">
                      <ArtistRowDesktop artist={artist} priority={i < 2} />
                    </div>
                  </div>
                ))
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
