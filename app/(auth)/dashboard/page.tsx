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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: row } = await admin
    .from("artists")
    .select(
      `
      id, handle, display_name, bio, profile_image_url,
      primary_styles, is_claimed, is_active,
      artist_locations(id, location_name, kind, is_current, starts_at, ends_at),
      portfolio_items(id, image_url, is_featured, sort_order)
    `,
    )
    .eq("claimed_by_user_id", user.id)
    .single();

  // No artist yet → send to onboarding
  if (!row) redirect("/onboarding");

  const artist = row as Record<string, unknown>;
  const locs = Array.isArray(artist.artist_locations) ? artist.artist_locations : [];
  const currentLoc = locs.find((l: Record<string, unknown>) => l.is_current);
  const portfolio = (Array.isArray(artist.portfolio_items) ? artist.portfolio_items : []) as Record<
    string,
    unknown
  >[];

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="bg-secondary relative size-16 shrink-0 overflow-hidden rounded-full">
          {artist.profile_image_url ? (
            <Image
              src={artist.profile_image_url as string}
              alt={artist.display_name as string}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-lg font-medium">
              {(artist.display_name as string).slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-medium">{artist.display_name as string}</h1>
          <p className="text-muted-foreground text-sm">@{artist.handle as string}</p>
          {currentLoc && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
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
        <StyleBadges styles={artist.primary_styles as ArtistPublic["primary_styles"]} max={6} />
      )}

      {/* Claim status banner */}
      {!artist.is_claimed && (
        <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-400">
          Your profile isn&apos;t verified yet.{" "}
          <Link href="/onboarding/verify" className="font-medium underline">
            Complete verification →
          </Link>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/locations"
          className="border-border bg-card hover:border-border/70 space-y-2 rounded-xl border p-4 transition-colors"
        >
          <MapPin className="text-muted-foreground size-5" />
          <p className="text-sm font-medium">Locations</p>
          <p className="text-muted-foreground text-xs">
            {locs.length} location{locs.length !== 1 ? "s" : ""}
          </p>
        </Link>
        <Link
          href="/dashboard/portfolio"
          className="border-border bg-card hover:border-border/70 space-y-2 rounded-xl border p-4 transition-colors"
        >
          <Grid2x2 className="text-muted-foreground size-5" />
          <p className="text-sm font-medium">Portfolio</p>
          <p className="text-muted-foreground text-xs">
            {portfolio.length} photo{portfolio.length !== 1 ? "s" : ""}
          </p>
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
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
      >
        <LogOut className="size-3" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
