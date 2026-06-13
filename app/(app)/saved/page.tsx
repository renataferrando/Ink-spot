import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { ArtistCard } from "@/components/artist/artist-card";
import { computeCurrentLocation } from "@/lib/location";
import { cn } from "@/lib/utils";
import { btnPrimaryLg, tabShellClass } from "@/lib/ui/classes";
import type { ArtistPublic } from "@/types/artist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved" };

const EMPTY_CLASS = cn(tabShellClass, "flex flex-1 flex-col items-center justify-center py-24 text-center");

async function getSavedArtists(
  admin: ReturnType<typeof getSupabaseAdminClientUntyped>,
  ids: string[],
): Promise<ArtistPublic[]> {
  const { data: artists } = await admin
    .from("artists")
    .select(`
      id, handle, display_name, bio,
      profile_image_url, cover_image_url,
      instagram_handle, website_url, contact_email,
      years_experience, primary_styles, style_description,
      is_demo, is_claimed, is_active,
      created_at, updated_at,
      artist_locations(id, artist_id, lat, lng, location_name, kind, starts_at, ends_at, is_current, studio_name, notes),
      portfolio_items(id, artist_id, image_url, caption, alt_text, detected_styles, is_featured, sort_order, width, height)
    `)
    .in("id", ids)
    .eq("is_active", true);

  const now = Date.now();
  const enriched: ArtistPublic[] = ((artists ?? []) as Record<string, unknown>[]).map((a) => {
    const locs = Array.isArray(a.artist_locations) ? a.artist_locations : [];
    const current = computeCurrentLocation(locs);
    const upcoming = locs
      .filter((l: Record<string, unknown>) => l.starts_at && new Date(l.starts_at as string).getTime() > now)
      .sort((x: Record<string, unknown>, y: Record<string, unknown>) =>
        new Date(x.starts_at as string).getTime() - new Date(y.starts_at as string).getTime()
      );

    return {
      id: a.id as string,
      handle: a.handle as string,
      display_name: a.display_name as string,
      bio: a.bio as string | null,
      profile_image_url: a.profile_image_url as string | null,
      cover_image_url: a.cover_image_url as string | null,
      instagram_handle: a.instagram_handle as string | null,
      website_url: a.website_url as string | null,
      contact_email: a.contact_email as string | null,
      years_experience: a.years_experience as number | null,
      primary_styles: (a.primary_styles ?? []) as ArtistPublic["primary_styles"],
      style_description: a.style_description as string | null,
      is_demo: a.is_demo as boolean,
      is_claimed: a.is_claimed as boolean,
      is_active: a.is_active as boolean,
      current_location: current as ArtistPublic["current_location"],
      upcoming_locations: upcoming as ArtistPublic["upcoming_locations"],
      portfolio_items: (Array.isArray(a.portfolio_items) ? a.portfolio_items : []) as ArtistPublic["portfolio_items"],
      created_at: a.created_at as string,
      updated_at: a.updated_at as string,
    };
  });

  // Preserve save order
  const byId = Object.fromEntries(enriched.map((a) => [a.id, a]));
  return ids.map((id) => byId[id]).filter(Boolean) as ArtistPublic[];
}

export default async function SavedPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={EMPTY_CLASS}>
        <Bookmark className="text-dim size-10" aria-hidden />
        <h1 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">No saved artists yet</h1>
        <p className="text-dim mt-2 max-w-xs text-[14px] leading-normal">
          Sign in to save favorite artists and access them across devices.
        </p>
        <Link href="/login" className={cn(btnPrimaryLg, "mt-6")}>
          Sign in
        </Link>
      </div>
    );
  }

  const admin = getSupabaseAdminClientUntyped();
  const { data: saved } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (saved ?? []).map((r: { artist_id: string }) => r.artist_id);

  if (ids.length === 0) {
    return (
      <div className={EMPTY_CLASS}>
        <Bookmark className="text-dim size-10" aria-hidden />
        <h1 className="mt-4 text-[22px] font-medium tracking-[-0.01em]">No saved artists yet</h1>
        <p className="text-dim mt-2 max-w-xs text-[14px] leading-normal">
          Tap the heart on any artist profile to save them here.
        </p>
        <Link href="/explore" className={cn(btnPrimaryLg, "mt-6")}>
          Explore artists
        </Link>
      </div>
    );
  }

  const ordered = await getSavedArtists(admin, ids);

  return (
    <div className={tabShellClass}>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-[28px] font-medium tracking-[-0.02em]">
          Saved <em className="text-ink-spot not-italic">artists</em>
        </h1>
        <span className="text-dim font-mono text-[11px] tracking-widest uppercase">
          {ordered.length}
        </span>
      </div>
      <div className="flex flex-col">
        {ordered.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </div>
  );
}
