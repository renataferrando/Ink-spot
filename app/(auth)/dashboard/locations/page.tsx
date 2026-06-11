import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageColumn } from "@/components/layout/page-container";
import { LocationTimeline } from "@/components/artist/location-timeline";
import { AddLocationForm } from "./add-location-form";
import { HomeBaseSection } from "./home-base-section";
import { computeCurrentLocation } from "@/lib/location";
import type { ArtistLocation } from "@/types/artist";

export const metadata: Metadata = { title: "Manage locations" };

export default async function LocationsPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) redirect("/onboarding");

  const { data: locs } = await admin
    .from("artist_locations")
    .select(
      "id, artist_id, lat, lng, location_name, kind, starts_at, ends_at, is_current, studio_name, notes",
    )
    .eq("artist_id", artist.id)
    .order("starts_at", { ascending: true });

  const locations = (locs ?? []) as ArtistLocation[];
  const homeBase = locations.find((l) => l.kind === "home_base") ?? null;
  const travelLocs = locations.filter((l) => l.kind !== "home_base");

  const computedCurrent = computeCurrentLocation(locations);
  const isHomeBaseActive = computedCurrent?.kind === "home_base";

  // For the timeline, only pass travel entries
  const currentTravel = computedCurrent?.kind !== "home_base" ? computedCurrent : null;
  const upcomingTravel = travelLocs.filter((l) => l.id !== currentTravel?.id);

  // For client-side overlap validation in the add form
  const travelLocsForValidation = travelLocs.map((l) => ({
    id: l.id,
    location_name: l.location_name,
    starts_at: l.starts_at ?? null,
    ends_at: l.ends_at ?? null,
  }));

  return (
    <PageColumn className="space-y-8 py-10">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-dim hover:text-(--text) -ml-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors"
        >
          <ChevronLeft size={14} aria-hidden />
          Back
        </Link>
      </div>

      <h1 className="text-[22px] font-medium tracking-[-0.02em]">Locations</h1>

      {/* ── Home base ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
          Home base
        </div>
        <HomeBaseSection homeBase={homeBase} isActive={isHomeBaseActive} />
      </div>

      {/* ── Travel dates ─────────────────────────────────────────── */}
      {homeBase && (
        <>
          {(currentTravel || upcomingTravel.length > 0) && (
            <div className="space-y-3">
              <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
                Travel dates
              </div>
              <LocationTimeline
                currentLocation={currentTravel}
                upcomingLocations={upcomingTravel}
                editable
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
              Add travel dates
            </div>
            <AddLocationForm existingTravelLocs={travelLocsForValidation} />
          </div>
        </>
      )}
    </PageColumn>
  );
}
