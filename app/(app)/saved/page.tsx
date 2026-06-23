import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped } from "@/lib/supabase/admin";
import { ArtistCard } from "@/components/artist/artist-card";
import { ARTIST_WITH_RELATIONS_SELECT, mapArtistRow } from "@/lib/data/artist-queries";
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
  const { data: artists, error } = await admin
    .from("artists")
    .select(ARTIST_WITH_RELATIONS_SELECT)
    .in("id", ids)
    .eq("is_active", true);

  if (error) console.error("getSavedArtists: failed to load artists", error);

  const enriched = ((artists ?? []) as Record<string, unknown>[]).map(mapArtistRow);

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
  const { data: saved, error } = await admin
    .from("saved_artists")
    .select("artist_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) console.error("SavedPage: failed to load saved artists", error);

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
