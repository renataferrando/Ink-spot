import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchMe,
} from "@/lib/instagram/oauth";
import { encryptToken } from "@/lib/instagram/crypto";
import { instagramOAuthEnabled } from "@/lib/validations/env";

/**
 * OAuth callback. Validates state (CSRF), exchanges the code, verifies the
 * account is BUSINESS/CREATOR and the username matches the artist's stored
 * `instagram_handle`, then stores the encrypted long-lived token and marks
 * the artist verified.
 *
 * On any error we redirect back to /onboarding/verify (or `next` if known)
 * with an `?error=<reason>` query param the UI can render.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fallback = (path: string, error: string) =>
    NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error)}`, request.url));

  if (!instagramOAuthEnabled()) {
    return fallback("/onboarding/verify", "ig_not_configured");
  }

  // ── Validate state ─────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const cookieState = cookieStore.get("inkspot_ig_state")?.value;
  const queryState = url.searchParams.get("state");
  cookieStore.delete("inkspot_ig_state");

  if (!cookieState || !queryState || cookieState !== queryState) {
    return fallback("/onboarding/verify", "state_mismatch");
  }

  let parsed: { n: string; u: string; r: string };
  try {
    parsed = JSON.parse(cookieState) as { n: string; u: string; r: string };
  } catch {
    return fallback("/onboarding/verify", "state_malformed");
  }
  const next = parsed.r.startsWith("/") && !parsed.r.startsWith("//") ? parsed.r : "/onboarding/location";

  // ── Meta-side errors come back as ?error_reason= ──────────────────────
  const igError = url.searchParams.get("error");
  if (igError) {
    const reason = url.searchParams.get("error_reason") ?? igError;
    return fallback(next, `ig_${reason}`);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return fallback(next, "missing_code");
  }

  // ── Auth (the cookie carries user_id as backup if session expired) ─────
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== parsed.u) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/onboarding/verify")}`, request.url),
    );
  }

  // ── Artist lookup (done before exchange so we can give better errors) ──
  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, handle, instagram_handle, instagram_user_id, is_claimed")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();
  if (!artist) {
    return fallback("/onboarding/verify", "no_artist");
  }

  // ── Token exchange ─────────────────────────────────────────────────────
  let longToken: string;
  let expiresIn: number;
  let me: Awaited<ReturnType<typeof fetchMe>>;
  try {
    const short = await exchangeCodeForShortLivedToken(code);
    const long = await exchangeForLongLivedToken(short.access_token);
    longToken = long.access_token;
    expiresIn = long.expires_in;
    me = await fetchMe(longToken);
  } catch (err) {
    console.error("[ig-oauth] token/me failed:", err);
    // Give a clearer message when the account was already connected — the
    // failure is likely a stale or reused code, not an Instagram rejection.
    if (artist.instagram_user_id) {
      return fallback(next, "ig_already_connected");
    }
    return fallback(next, "exchange_failed");
  }

  // ── Account type guard ────────────────────────────────────────────────
  if (me.account_type === "PERSONAL") {
    return fallback(next, "personal_account");
  }

  // ── Username match ────────────────────────────────────────────────────
  const storedHandle = (artist.instagram_handle as string | null)?.toLowerCase();
  const igUsername = me.username.toLowerCase();
  if (!storedHandle) {
    const { data: collision } = await admin
      .from("artists")
      .select("id")
      .eq("instagram_handle", igUsername)
      .neq("id", artist.id)
      .maybeSingle();
    if (collision) {
      return fallback(next, "handle_taken");
    }
  }
  if (storedHandle && storedHandle !== igUsername) {
    return fallback(next, "handle_mismatch");
  }

  // ── Persist ────────────────────────────────────────────────────────────
  let encryptedToken: string;
  try {
    encryptedToken = encryptToken(longToken);
  } catch (err) {
    console.error("[ig-oauth] token encryption failed:", err);
    return fallback(next, "persist_failed");
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { error: updateError } = await admin
    .from("artists")
    .update({
      instagram_handle: storedHandle ?? me.username,
      instagram_user_id: me.id,
      instagram_account_type: me.account_type,
      instagram_token_encrypted: encryptedToken,
      instagram_token_expires_at: expiresAt,
      verification_method: "instagram_oauth",
      is_claimed: true,
    })
    .eq("id", artist.id);
  if (updateError) {
    console.error("[ig-oauth] update artist failed:", updateError);
    return fallback(next, "persist_failed");
  }

  // Approve any pending bio-code claim for this artist — OAuth supersedes.
  await admin
    .from("claims")
    .update({ status: "approved", notes: "superseded_by_oauth" })
    .eq("artist_id", artist.id)
    .eq("status", "pending");

  revalidateTag(`artist:${artist.handle}`, "max");
  revalidatePath(`/artist/${artist.handle}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/account");

  return NextResponse.redirect(new URL(next, request.url));
}
