import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtistProfile } from "@/components/artist/artist-profile";
import type { ArtistPublic } from "@/types/artist";
import { computeCurrentLocation, computeNextLocation } from "@/lib/location";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getArtist(handle: string): Promise<ArtistPublic | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
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

      const { data, error } = await supabase
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
        .eq("handle", handle)
        .eq("is_active", true)
        .single()
        .returns<Record<string, unknown>>();

      if (!error && data) {
        const locs = Array.isArray(data.artist_locations) ? data.artist_locations : [];
        const current = computeCurrentLocation(locs);
        const next = computeNextLocation(locs, current);
        const upcoming = locs
          .filter(
            (l: Record<string, unknown>) =>
              l.id !== current?.id && l.starts_at && new Date(l.starts_at as string) > new Date(),
          )
          .sort(
            (a, b) =>
              new Date(a.starts_at as string).getTime() -
              new Date(b.starts_at as string).getTime(),
          );
        return {
          id: data.id as string,
          handle: data.handle as string,
          display_name: data.display_name as string,
          bio: data.bio as string | null,
          current_location: current as ArtistPublic["current_location"],
          upcoming_locations: upcoming as ArtistPublic["upcoming_locations"],
          next_location: next
            ? {
                location_name: next.location.location_name,
                kind: next.location.kind,
                starts_at: next.starts_at,
                ends_at: next.location.kind === "home_base" ? null : next.location.ends_at ?? null,
                studio_name: next.location.studio_name ?? null,
              }
            : null,
          instagram_handle: data.instagram_handle as string | null,
          profile_image_url: data.profile_image_url as string | null,
          cover_image_url: data.cover_image_url as string | null,
          website_url: data.website_url as string | null,
          contact_email: data.contact_email as string | null,
          years_experience: data.years_experience as number | null,
          primary_styles: (data.primary_styles ?? []) as ArtistPublic["primary_styles"],
          style_description: data.style_description as string | null,
          is_demo: data.is_demo as boolean,
          is_claimed: data.is_claimed as boolean,
          is_active: data.is_active as boolean,
          portfolio_items: (Array.isArray(data.portfolio_items)
            ? data.portfolio_items
            : []) as ArtistPublic["portfolio_items"],
          created_at: data.created_at as string,
          updated_at: data.updated_at as string,
        } satisfies ArtistPublic;
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function getAllHandles(): Promise<string[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
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

      const { data } = await supabase.from("artists").select("handle").eq("is_active", true);

      if (data) return data.map((r: { handle: string }) => r.handle);
    } catch {
      return [];
    }
  }

  return [];
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const handles = await getAllHandles();
  return handles.map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const artist = await getArtist(handle);
  if (!artist) return {};

  const locationName = artist.current_location?.location_name;

  return {
    title: locationName
      ? `${artist.display_name} — Tattoo artist · ${locationName}`
      : `${artist.display_name} — Tattoo artist`,
    description: artist.bio?.slice(0, 155) ?? `${artist.display_name} portfolio on InkSpot`,
    openGraph: {
      title: artist.display_name,
      description: artist.bio?.slice(0, 155),
      images: artist.profile_image_url
        ? [{ url: artist.profile_image_url, width: 400, height: 400 }]
        : [],
      type: "profile",
    },
    robots: artist.is_demo && !artist.is_claimed ? { index: false, follow: false } : undefined,
  };
}

async function getAiSummary(artistId: string): Promise<string | null> {
  try {
    const admin = getSupabaseAdminClientUntyped();
    const now = new Date().toISOString();
    const { data } = await admin
      .from("ai_artist_summaries")
      .select("content")
      .eq("artist_id", artistId)
      .gt("expires_at", now)
      .single();
    return data?.content ?? null;
  } catch {
    return null;
  }
}

export default async function ArtistPage({ params }: Props) {
  const { handle } = await params;
  const artist = await getArtist(handle);
  if (!artist) notFound();

  const [aiSummary, supabase] = await Promise.all([
    artist.is_demo ? Promise.resolve(null) : getAiSummary(artist.id),
    getSupabaseServerClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();

  let isSaved = false;
  let isOwner = false;
  if (user) {
    const admin = getSupabaseAdminClientUntyped();
    const [savedResult, ownerResult] = await Promise.all([
      admin
        .from("saved_artists")
        .select("artist_id")
        .eq("user_id", user.id)
        .eq("artist_id", artist.id)
        .maybeSingle(),
      admin
        .from("artists")
        .select("id")
        .eq("handle", handle)
        .eq("claimed_by_user_id", user.id)
        .maybeSingle(),
    ]);
    isSaved = !!savedResult.data;
    isOwner = !!ownerResult.data;
  }

  return <ArtistProfile artist={artist} aiSummary={aiSummary} isSaved={isSaved} isOwner={isOwner} />;
}
