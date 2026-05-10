"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const Schema = z.object({
  studio_name:       z.string().min(2, "Studio name must be at least 2 characters").max(100),
  instagram_handle:  z.string().max(30).regex(/^[a-zA-Z0-9_.]*$/, "Invalid Instagram handle").optional().or(z.literal("")),
  bio:               z.string().max(200).optional(),
  years_experience:  z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
});

export type CreateProfileState = { error?: string };

export async function createProfile(
  _prev: CreateProfileState,
  formData: FormData,
): Promise<CreateProfileState> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Validate ──────────────────────────────────────────────────────────────
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { studio_name, instagram_handle, bio, years_experience } = parsed.data;
  const igHandle = instagram_handle || null;

  const admin = getSupabaseAdminClient();

  // ── Check for existing profile ────────────────────────────────────────────
  const { data: existing } = await admin
    .from("artists")
    .select("handle")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (existing) redirect("/dashboard");

  // ── Demo handle match? ────────────────────────────────────────────────────
  if (igHandle) {
    const { data: demo } = await admin
      .from("artists")
      .select("id, handle, display_name")
      .eq("instagram_handle", igHandle)
      .eq("is_demo", true)
      .single();

    if (demo) {
      const cookieStore = await cookies();
      cookieStore.set("inkspot_pending_studio", studio_name, { httpOnly: true, path: "/", maxAge: 3600 });
      cookieStore.set("inkspot_pending_ig", igHandle, { httpOnly: true, path: "/", maxAge: 3600 });
      cookieStore.set("inkspot_demo_handle", demo.handle, { httpOnly: true, path: "/", maxAge: 3600 });
      redirect("/onboarding/claim");
    }
  }

  // ── Generate unique handle ────────────────────────────────────────────────
  const base = slugify(studio_name) || "studio";
  let handle = base;
  let suffix = 2;
  for (;;) {
    const { data } = await admin.from("artists").select("id").eq("handle", handle).maybeSingle();
    if (!data) break;
    handle = `${base}-${suffix++}`;
  }

  // ── Create artist ─────────────────────────────────────────────────────────
  const { error: insertError } = await admin.from("artists").insert({
    handle,
    display_name:      studio_name,
    bio:               bio || null,
    instagram_handle:  igHandle,
    years_experience:  typeof years_experience === "number" ? years_experience : null,
    is_demo:           false,
    is_claimed:        false, // always false until verified; artists without IG skip the verify step but remain unverified
    is_active:         true,
    claimed_by_user_id: user.id,
  });

  if (insertError) {
    return { error: "Failed to create profile. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set("inkspot_handle", handle, { httpOnly: true, path: "/", maxAge: 86400 });

  redirect(igHandle ? "/onboarding/verify" : "/onboarding/location");
}
