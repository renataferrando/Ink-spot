"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocoding/opencage";

const AddLocationSchema = z.object({
  // The autocomplete component writes these when the user selects a candidate.
  // They take precedence over a raw address string.
  address_lat: z.coerce.number().optional(),
  address_lng: z.coerce.number().optional(),
  address: z.string().min(2, "Please select a location from the suggestions"),
  studio_name: z.string().max(100).optional(),
  kind: z.enum(["home_base", "guest_spot", "traveling"]).default("home_base"),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
});

export type ManageLocationState = { error?: string; success?: boolean };

export async function addLocation(
  _prev: ManageLocationState,
  formData: FormData,
): Promise<ManageLocationState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = AddLocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { address, address_lat, address_lng, studio_name, kind, starts_at, ends_at } = parsed.data;

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { error: "Artist not found." };

  // Resolve coordinates: prefer pre-resolved lat/lng from autocomplete,
  // fall back to geocoding only as a last resort (e.g. non-JS submission).
  let lat: number;
  let lng: number;
  let locationName: string;

  if (address_lat != null && address_lng != null) {
    lat = address_lat;
    lng = address_lng;
    locationName = address;
  } else {
    const geo = await geocodeAddress(address);
    if (!geo) {
      return {
        error: "Could not resolve that location. Please select a suggestion from the dropdown.",
      };
    }
    lat = geo.lat;
    lng = geo.lng;
    locationName = geo.formatted;
  }

  // If home_base, clear the existing current location first
  if (kind === "home_base") {
    await admin
      .from("artist_locations")
      .update({ is_current: false })
      .eq("artist_id", artist.id)
      .eq("is_current", true);
  }

  await admin.from("artist_locations").insert({
    artist_id: artist.id,
    lat,
    lng,
    location_name: locationName,
    kind,
    is_current: kind === "home_base",
    studio_name: studio_name || null,
    starts_at: starts_at || null,
    ends_at: ends_at || null,
  });

  return { success: true };
}

export async function toggleCurrentLocation(locationId: string) {
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
  if (!artist) return;

  await admin
    .from("artist_locations")
    .update({ is_current: false })
    .eq("artist_id", artist.id)
    .eq("is_current", true);

  await admin
    .from("artist_locations")
    .update({ is_current: true })
    .eq("id", locationId)
    .eq("artist_id", artist.id);
}
