import type { SupabaseClient } from "@supabase/supabase-js";

/** Format: INK-{4 uppercase hex} e.g. INK-9F2A */
export function generateVerificationCode() {
  return (
    "INK-" +
    Array.from(crypto.getRandomValues(new Uint8Array(2)))
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

/** Returns an existing pending claim code or creates a new pending claim row. */
export async function ensurePendingClaim(
  admin: SupabaseClient,
  artistId: string,
  userId: string,
  instagramHandle: string,
): Promise<string> {
  const { data: existing, error: selectError } = await admin
    .from("claims")
    .select("id, verification_code")
    .eq("artist_id", artistId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to look up pending claim: ${selectError.message}`);
  }

  if (existing?.verification_code) {
    return existing.verification_code as string;
  }

  const code = generateVerificationCode();
  const { error: insertError } = await admin.from("claims").insert({
    artist_id: artistId,
    instagram_user_id: userId,
    instagram_handle: instagramHandle,
    status: "pending",
    verification_code: code,
  });

  if (insertError) {
    throw new Error(`Failed to create pending claim: ${insertError.message}`);
  }

  return code;
}
