import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtistProfile } from "@/components/artist/artist-profile";
import type { ArtistPublic } from "@/types/artist";
import { ARTIST_WITH_RELATIONS_SELECT, mapArtistRow } from "@/lib/data/artist-queries";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

type Props = { params: Promise<{ handle: string }> };

// ── Data fetching ─────────────────────────────────────────────────────────────
// Uses the cookie-free public client deliberately: this page is time-cached
// (revalidate = 60) and combining that with a cookie-bound client makes Next.js
// flip the route to dynamic mid-flight ("Page changed from static to dynamic at
// runtime, reason: cookies"), which 500s on every regeneration. Per-user state
// (saved/owner) is fetched client-side instead — see ArtistProfile.

async function getArtist(handle: string): Promise<ArtistPublic | null> {
  try {
    const supabase = getSupabasePublicClient();
    const { data, error } = await supabase
      .from("artists")
      .select(ARTIST_WITH_RELATIONS_SELECT)
      .eq("handle", handle)
      .eq("is_active", true)
      .single()
      .returns<Record<string, unknown>>();

    if (!error && data) {
      return mapArtistRow(data);
    }
  } catch {
    return null;
  }

  return null;
}

async function getAllHandles(): Promise<string[]> {
  try {
    const supabase = getSupabasePublicClient();
    const { data } = await supabase.from("artists").select("handle").eq("is_active", true);

    if (data) return data.map((r: { handle: string }) => r.handle);
  } catch {
    return [];
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

  const aiSummary = artist.is_demo ? null : await getAiSummary(artist.id);

  // Saved/owner state is per-viewer and fetched client-side (see ArtistProfile)
  // rather than here — reading cookies() in this revalidate-cached page would
  // reintroduce the static/dynamic conflict this route was built to avoid.
  return <ArtistProfile artist={artist} aiSummary={aiSummary} />;
}
