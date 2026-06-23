"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ALL_STYLES } from "@/types/artist";

const StyleEnum = z.enum(ALL_STYLES as [string, ...string[]]);

const Schema = z.object({
  display_name: z
    .string()
    .min(2, "Studio name must be at least 2 characters")
    .max(100, "Studio name is too long"),
  instagram_handle: z
    .string()
    .max(30)
    .regex(/^[a-zA-Z0-9_.]*$/, "Invalid Instagram handle")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(200).optional().or(z.literal("")),
  website_url: z.string().url("Enter a full URL (https://…)").optional().or(z.literal("")),
  contact_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
  primary_styles: z.array(StyleEnum).max(3, "Pick at most 3 styles").optional(),
  is_active: z.coerce.boolean().optional(),
});

export type UpdateProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // FormData → plain object. primary_styles is a repeating field.
  const raw = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const parsed = Schema.safeParse({
    ...raw,
    primary_styles: formData.getAll("primary_styles").map(String),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const {
    display_name,
    instagram_handle,
    bio,
    website_url,
    contact_email,
    years_experience,
    primary_styles,
    is_active,
  } = parsed.data;
  const newIg = instagram_handle ? instagram_handle : null;

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle, instagram_handle, is_claimed")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { error: "Artist not found." };

  // ── IG handle change handling ────────────────────────────────────────────
  // - On change: ensure no other artist row owns it, then reset is_claimed
  //   and reject any stale pending claims so /onboarding/verify regenerates
  //   the code against the new handle.
  const igChanged = (artist.instagram_handle ?? null) !== newIg;
  if (igChanged && newIg) {
    const { data: collision } = await admin
      .from("artists")
      .select("id")
      .eq("instagram_handle", newIg)
      .neq("id", artist.id)
      .maybeSingle();
    if (collision) {
      return { error: "That Instagram handle is already in use." };
    }
  }

  const patch: Record<string, unknown> = {
    display_name,
    instagram_handle: newIg,
    bio: bio || null,
    website_url: website_url || null,
    contact_email: contact_email || null,
    years_experience: typeof years_experience === "number" ? years_experience : null,
    primary_styles: primary_styles ?? [],
  };
  if (typeof is_active === "boolean") patch.is_active = is_active;
  if (igChanged) {
    patch.is_claimed = false;
    patch.instagram_token_encrypted = null;
    patch.instagram_token_expires_at = null;
    patch.instagram_user_id = null;
    patch.verification_method = null;
  }

  const { error: updateError } = await admin.from("artists").update(patch).eq("id", artist.id);
  if (updateError) {
    return { error: updateError.message };
  }

  if (igChanged) {
    await admin
      .from("claims")
      .update({ status: "rejected", notes: "handle_changed" })
      .eq("artist_id", artist.id)
      .eq("status", "pending");
  }

  revalidateTag(`artist:${artist.handle}`, "max");
  revalidatePath(`/artist/${artist.handle}`);
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/explore");

  return { success: true };
}

export type ToggleActiveState = { error?: string; success?: boolean };

/** Deactivate (or reactivate) the artist's public profile. */
export async function setProfileActive(
  _prev: ToggleActiveState,
  formData: FormData,
): Promise<ToggleActiveState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const next = formData.get("is_active") === "true";

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { error: "Artist not found." };

  const { error } = await admin
    .from("artists")
    .update({ is_active: next })
    .eq("id", artist.id);
  if (error) return { error: error.message };

  revalidateTag(`artist:${artist.handle}`, "max");
  revalidatePath(`/artist/${artist.handle}`);
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/explore");

  return { success: true };
}
