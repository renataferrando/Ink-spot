"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";

import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/instagram/crypto";

export type DisconnectInstagramState = { error?: string; success?: boolean };

/**
 * Severs the Instagram OAuth connection from the artist's row.
 *
 * Revokes the token on Meta's side before clearing it locally. Without
 * revoking, Instagram remembers the "previously connected" state and routes
 * any future authorization through its ig_biz_login_oauth re-auth flow, which
 * has a redirect_uri comparison bug that breaks the code exchange.
 */
export async function disconnectInstagram(
  _prev: DisconnectInstagramState,
  _formData: FormData,
): Promise<DisconnectInstagramState> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle, instagram_user_id, instagram_token_encrypted")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();
  if (!artist) return { error: "Artist not found." };

  // Revoke on Meta's side so the next connect is a fresh authorization, not
  // the "previously connected" re-auth flow which breaks the code exchange.
  const encryptedToken = artist.instagram_token_encrypted as string | null;
  const igUserId = artist.instagram_user_id as string | null;
  if (encryptedToken && igUserId) {
    try {
      const token = decryptToken(encryptedToken);
      await fetch(
        `https://graph.instagram.com/${igUserId}/permissions?access_token=${token}`,
        { method: "DELETE" },
      );
    } catch {
      // Best-effort — proceed with local disconnect even if revoke fails
    }
  }

  const { error } = await admin
    .from("artists")
    .update({
      instagram_token_encrypted: null,
      instagram_token_expires_at: null,
      instagram_account_type: null,
      // Keep `is_claimed=true`; reset method so future re-verification
      // can be either bio_code or instagram_oauth.
      verification_method: null,
    })
    .eq("id", artist.id);
  if (error) return { error: error.message };

  revalidateTag(`artist:${artist.handle}`, "max");
  revalidatePath(`/artist/${artist.handle}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/account");

  return { success: true };
}
