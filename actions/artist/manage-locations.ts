"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocoding/opencage";
import { dateRangesOverlap, computeCurrentLocation } from "@/lib/location";

// ── Schemas ───────────────────────────────────────────────────────────────────

const LocationCoords = {
  address_lat: z.coerce.number().optional(),
  address_lng: z.coerce.number().optional(),
  address: z.string().min(2, "Please select a location from the suggestions"),
  studio_name: z.string().max(100).optional(),
};

const AddLocationSchema = z.object({
  ...LocationCoords,
  kind: z.enum(["home_base", "guest_spot", "traveling"]).default("home_base"),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
});

const SetHomeBaseSchema = z.object(LocationCoords);

const UpdateLocationSchema = z.object({
  id: z.string().uuid(),
  ...LocationCoords,
  kind: z.enum(["guest_spot", "traveling"]).default("guest_spot"),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type ManageLocationState = { error?: string; success?: boolean };

// ── Private helpers ───────────────────────────────────────────────────────────

async function resolveCoords(
  address: string,
  lat: number | undefined,
  lng: number | undefined,
): Promise<{ lat: number; lng: number; locationName: string } | { error: string }> {
  if (lat != null && lng != null) {
    return { lat, lng, locationName: address };
  }
  const geo = await geocodeAddress(address);
  if (!geo) {
    return {
      error: "Could not resolve that location. Please select a suggestion from the dropdown.",
    };
  }
  return { lat: geo.lat, lng: geo.lng, locationName: geo.formatted };
}

async function getArtistId(userId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("artists")
    .select("id")
    .eq("claimed_by_user_id", userId)
    .single();
  return data?.id ?? null;
}

/** Re-derives is_current for every location of an artist from actual date ranges,
 *  keeping the DB flag in sync after any mutation. */
async function syncIsCurrent(artistId: string) {
  const admin = getSupabaseAdminClient();
  const { data: locs } = await admin
    .from("artist_locations")
    .select("id, kind, starts_at, ends_at")
    .eq("artist_id", artistId);

  if (!locs?.length) return;

  const current = computeCurrentLocation(locs);

  await admin.from("artist_locations").update({ is_current: false }).eq("artist_id", artistId);

  if (current) {
    await admin.from("artist_locations").update({ is_current: true }).eq("id", current.id);
  }
}

// ── Public actions ────────────────────────────────────────────────────────────

/** Creates or updates (upserts) the artist's home base. Safe to call at any
 *  point — updates in place when one already exists. */
export async function setHomeBase(
  _prev: ManageLocationState,
  formData: FormData,
): Promise<ManageLocationState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = SetHomeBaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { address, address_lat, address_lng, studio_name } = parsed.data;

  const artistId = await getArtistId(user.id);
  if (!artistId) return { error: "Artist not found." };

  const coords = await resolveCoords(address, address_lat, address_lng);
  if ("error" in coords) return { error: coords.error };
  const { lat, lng, locationName } = coords;

  const admin = getSupabaseAdminClient();
  const { data: existing } = await admin
    .from("artist_locations")
    .select("id")
    .eq("artist_id", artistId)
    .eq("kind", "home_base")
    .maybeSingle();

  if (existing) {
    await admin
      .from("artist_locations")
      .update({ lat, lng, location_name: locationName, studio_name: studio_name || null })
      .eq("id", existing.id);
  } else {
    await admin.from("artist_locations").insert({
      artist_id: artistId,
      lat,
      lng,
      location_name: locationName,
      kind: "home_base",
      is_current: true,
      studio_name: studio_name || null,
      starts_at: null,
      ends_at: null,
    });
  }

  await syncIsCurrent(artistId);
  return { success: true };
}

/** Adds a new guest_spot or traveling entry. Validates overlap server-side;
 *  the DB exclusion constraint is the final safety net. */
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

  const artistId = await getArtistId(user.id);
  if (!artistId) return { error: "Artist not found." };

  const admin = getSupabaseAdminClient();
  const { data: existing } = await admin
    .from("artist_locations")
    .select("id, kind, location_name, starts_at, ends_at")
    .eq("artist_id", artistId);

  const existingLocs = existing ?? [];

  if (kind === "home_base") {
    if (existingLocs.some((l) => l.kind === "home_base")) {
      return { error: "You already have a home base. Use the edit button to update it." };
    }
  } else {
    if (!existingLocs.some((l) => l.kind === "home_base")) {
      return { error: "Please add a home base location first before adding travel dates." };
    }

    if (starts_at) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (starts_at < todayStr) {
        return { error: "Start date cannot be in the past." };
      }
      if (ends_at && ends_at < starts_at) {
        return { error: "End date must be on or after the start date." };
      }

      const travelLocs = existingLocs.filter((l) => l.kind !== "home_base" && l.starts_at);
      for (const loc of travelLocs) {
        if (dateRangesOverlap(starts_at, ends_at || null, loc.starts_at, loc.ends_at)) {
          return {
            error: `Dates overlap with "${loc.location_name}". Please choose different dates.`,
          };
        }
      }
    }
  }

  const coords = await resolveCoords(address, address_lat, address_lng);
  if ("error" in coords) return { error: coords.error };
  const { lat, lng, locationName } = coords;

  await admin.from("artist_locations").insert({
    artist_id: artistId,
    lat,
    lng,
    location_name: locationName,
    kind,
    is_current: false,
    studio_name: studio_name || null,
    starts_at: starts_at || null,
    ends_at: ends_at || null,
  });

  await syncIsCurrent(artistId);
  return { success: true };
}

/** Updates location, dates, or studio for an existing travel entry. */
export async function updateLocation(
  _prev: ManageLocationState,
  formData: FormData,
): Promise<ManageLocationState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = UpdateLocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, address, address_lat, address_lng, studio_name, kind, starts_at, ends_at } =
    parsed.data;

  const artistId = await getArtistId(user.id);
  if (!artistId) return { error: "Artist not found." };

  const admin = getSupabaseAdminClient();

  const { data: locCheck } = await admin
    .from("artist_locations")
    .select("id")
    .eq("id", id)
    .eq("artist_id", artistId)
    .single();
  if (!locCheck) return { error: "Location not found." };

  if (starts_at && ends_at && ends_at < starts_at) {
    return { error: "End date must be on or after the start date." };
  }

  if (starts_at) {
    const { data: others } = await admin
      .from("artist_locations")
      .select("id, location_name, starts_at, ends_at")
      .eq("artist_id", artistId)
      .neq("kind", "home_base")
      .neq("id", id)
      .not("starts_at", "is", null);

    for (const other of others ?? []) {
      if (
        dateRangesOverlap(
          starts_at,
          ends_at || null,
          other.starts_at as string,
          other.ends_at as string | null,
        )
      ) {
        return {
          error: `Dates overlap with "${other.location_name}". Please choose different dates.`,
        };
      }
    }
  }

  const coords = await resolveCoords(address, address_lat, address_lng);
  if ("error" in coords) return { error: coords.error };
  const { lat, lng, locationName } = coords;

  await admin
    .from("artist_locations")
    .update({
      lat,
      lng,
      location_name: locationName,
      kind,
      studio_name: studio_name || null,
      starts_at: starts_at || null,
      ends_at: ends_at || null,
    })
    .eq("id", id)
    .eq("artist_id", artistId);

  await syncIsCurrent(artistId);
  return { success: true };
}

export async function deleteLocation(locationId: string) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const artistId = await getArtistId(user.id);
  if (!artistId) return;

  const admin = getSupabaseAdminClient();
  await admin
    .from("artist_locations")
    .delete()
    .eq("id", locationId)
    .eq("artist_id", artistId);

  await syncIsCurrent(artistId);
}
