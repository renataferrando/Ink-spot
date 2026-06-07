import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { DashboardClient, type DashboardData } from "./dashboard-client";

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
      id, handle, display_name, bio, profile_image_url, cover_image_url,
      instagram_handle, primary_styles, is_claimed, is_active,
      years_experience, website_url, contact_email,
      artist_locations(id, location_name, kind, is_current, starts_at, ends_at),
      portfolio_items(id, image_url, is_featured, sort_order)
    `,
    )
    .eq("claimed_by_user_id", user.id)
    .single();

  if (!row) redirect("/onboarding");

  const artist = row as Record<string, unknown>;
  const locs = (Array.isArray(artist.artist_locations) ? artist.artist_locations : []) as Record<string, unknown>[];
  const portfolio = (Array.isArray(artist.portfolio_items) ? artist.portfolio_items : []) as Record<string, unknown>[];

  const currentLoc = locs.find((l) => l.is_current) ?? null;
  const nextLoc =
    locs
      .filter((l) => !l.is_current && l.starts_at)
      .sort((a, b) => (a.starts_at as string).localeCompare(b.starts_at as string))[0] ?? null;

  // Profile strength — 5 dimensions, 20 pts each
  let strength = 0;
  if (artist.display_name) strength += 20;
  if (artist.bio) strength += 20;
  if (artist.profile_image_url) strength += 20;
  if (portfolio.length >= 3) strength += 20;
  if (artist.instagram_handle) strength += 10;
  if (artist.is_claimed) strength += 10;

  const data: DashboardData = {
    displayName: artist.display_name as string,
    handle: artist.handle as string,
    bio: artist.bio as string | null,
    profileImageUrl: artist.profile_image_url as string | null,
    isActive: Boolean(artist.is_active),
    isClaimed: Boolean(artist.is_claimed),
    hasInstagram: Boolean(artist.instagram_handle),
    currentLocation: currentLoc
      ? { location_name: currentLoc.location_name as string }
      : null,
    nextLocation: nextLoc
      ? {
          location_name: nextLoc.location_name as string,
          starts_at: nextLoc.starts_at as string | null,
        }
      : null,
    portfolioItems: portfolio
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((p) => ({ id: p.id as string, image_url: p.image_url as string })),
    profileStrength: strength,
  };

  return <DashboardClient data={data} />;
}
