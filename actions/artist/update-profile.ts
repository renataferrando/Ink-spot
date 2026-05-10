"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const Schema = z.object({
  bio:              z.string().max(200).optional(),
  website_url:      z.string().url().optional().or(z.literal("")),
  contact_email:    z.string().email().optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(60).optional().or(z.literal("")),
});

export type UpdateProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { bio, website_url, contact_email, years_experience } = parsed.data;

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { error: "Artist not found." };

  await admin.from("artists").update({
    bio:              bio || null,
    website_url:      website_url || null,
    contact_email:    contact_email || null,
    years_experience: typeof years_experience === "number" ? years_experience : null,
  }).eq("id", artist.id);

  revalidateTag(`artist:${artist.handle}`, "max");
  return { success: true };
}
