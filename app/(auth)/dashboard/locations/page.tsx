import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { LocationTimeline } from "@/components/artist/location-timeline";
import { AddLocationForm } from "./add-location-form";
import type { ArtistLocation } from "@/types/artist";

export const metadata: Metadata = { title: "Manage locations" };

export default async function LocationsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
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
    .select("id, artist_id, lat, lng, location_name, kind, starts_at, ends_at, is_current, studio_name, notes")
    .eq("artist_id", artist.id)
    .order("is_current", { ascending: false })
    .order("starts_at", { ascending: true });

  const locations = (locs ?? []) as ArtistLocation[];
  const current  = locations.find((l) => l.is_current) ?? null;
  const upcoming = locations.filter((l) => !l.is_current);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <h1 className="text-xl font-medium">Manage locations</h1>

      <LocationTimeline currentLocation={current} upcomingLocations={upcoming} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Add location</h2>
        <AddLocationForm />
      </div>
    </div>
  );
}
