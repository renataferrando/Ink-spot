import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArtistProfile } from "@/components/artist/artist-profile";
import type { ArtistPublic } from "@/types/artist";
import { ARTIST_WITH_RELATIONS_SELECT, mapArtistRow } from "@/lib/data/artist-queries";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 60;

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
