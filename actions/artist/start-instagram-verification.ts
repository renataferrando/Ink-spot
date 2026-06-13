"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ensurePendingClaim } from "@/lib/claims/pending-claim";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const HandleSchema = z
  .string()
  .min(1, "Enter your Instagram handle")
  .max(30)
  .regex(/^[a-zA-Z0-9_.]+$/, "Invalid Instagram handle");

export type StartInstagramVerificationState = {
  error?: string;
  success?: boolean;
  handle?: string;
  code?: string;
};

export async function startInstagramVerification(
  _prev: StartInstagramVerificationState,
  formData: FormData,
): Promise<StartInstagramVerificationState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = HandleSchema.safeParse(formData.get("instagram_handle"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid handle" };
  }
  const handle = parsed.data.replace(/^@/, "");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle, instagram_handle, is_claimed")
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) return { error: "Artist not found." };
  if (artist.is_claimed) return { error: "Profile is already verified." };

  const { data: collision } = await admin
    .from("artists")
    .select("id")
    .eq("instagram_handle", handle)
    .neq("id", artist.id)
    .maybeSingle();
  if (collision) {
    return { error: "That Instagram handle is already in use." };
  }

  const igChanged = (artist.instagram_handle ?? null) !== handle;
  if (igChanged) {
    const { error: updateError } = await admin
      .from("artists")
      .update({
        instagram_handle: handle,
        is_claimed: false,
        instagram_token_encrypted: null,
        instagram_token_expires_at: null,
        instagram_user_id: null,
        verification_method: null,
      })
      .eq("id", artist.id);
    if (updateError) return { error: updateError.message };

    await admin
      .from("claims")
      .update({ status: "rejected", notes: "handle_changed" })
      .eq("artist_id", artist.id)
      .eq("status", "pending");
  }

  const code = await ensurePendingClaim(admin, artist.id, user.id, handle);

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  return { success: true, handle, code };
}
