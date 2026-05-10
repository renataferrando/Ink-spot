import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPin, Grid2x2, Pencil, LogOut } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/actions/auth/sign-out";
import { Button } from "@/components/ui/button";
import { StyleBadges } from "@/components/artist/style-badges";
import type { ArtistPublic } from "@/types/artist";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: row } = await admin
    .from("artists")
    .select(`
      id, handle, display_name, bio, profile_image_url,
      primary_styles, is_claimed, is_active,
      artist_locations(id, location_name, kind, is_current, starts_at, ends_at),
      portfolio_items(id, image_url, is_featured, sort_order)
    `)
    .eq("claimed_by_user_id", user.id)
    .single();

  // No artist yet → send to onboarding
  if (!row) redirect("/onboarding");

  const artist = row as Record<string, unknown>;
  const locs = Array.isArray(artist.artist_locations) ? artist.artist_locations : [];
  const currentLoc = locs.find((l: Record<string, unknown>) => l.is_current);
  const portfolio  = (Array.isArray(artist.portfolio_items) ? artist.portfolio_items : []) as Record<string, unknown>[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-secondary">
          {artist.profile_image_url ? (
            <Image src={artist.profile_image_url as string} alt={artist.display_name as string} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-lg font-medium text-muted-foreground">
              {(artist.display_name as string).slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium truncate">{artist.display_name as string}</h1>
          <p className="text-sm text-muted-foreground">@{artist.handle as string}</p>
          {currentLoc && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              {(currentLoc as Record<string, unknown>).location_name as string}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/profile">
              <Pencil className="size-3" aria-hidden /> Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/artist/${artist.handle as string}`}>
              View <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </div>

      {(artist.primary_styles as string[])?.length > 0 && (
        <StyleBadges styles={(artist.primary_styles as ArtistPublic["primary_styles"])} max={6} />
      )}

      {/* Claim status banner */}
      {!artist.is_claimed && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-400">
          Your profile isn&apos;t verified yet.{" "}
          <Link href="/onboarding/verify" className="underline font-medium">
            Complete verification →
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/locations" className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-border/70 transition-colors">
          <MapPin className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">Locations</p>
          <p className="text-xs text-muted-foreground">{locs.length} location{locs.length !== 1 ? "s" : ""}</p>
        </Link>
        <Link href="/dashboard/portfolio" className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-border/70 transition-colors">
          <Grid2x2 className="size-5 text-muted-foreground" />
          <p className="text-sm font-medium">Portfolio</p>
          <p className="text-xs text-muted-foreground">{portfolio.length} photo{portfolio.length !== 1 ? "s" : ""}</p>
        </Link>
      </div>

      {/* Sign out */}
      <SignOutButton />
    </div>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="size-3" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
