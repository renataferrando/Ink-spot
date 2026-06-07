import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "@/lib/instagram/crypto";
import { refreshLongLivedToken } from "@/lib/instagram/oauth";
import { instagramOAuthEnabled } from "@/lib/validations/env";

/**
 * Daily cron — refresh Instagram long-lived tokens that expire within ~14 days.
 *
 * Schedule: 11 4 * * * (daily at 04:11 UTC, off-peak in the launch market).
 *
 * Failures per-artist are logged and skipped; one bad token never blocks the
 * rest. If a refresh returns 4xx (artist revoked the app in IG settings), we
 * clear the token + mark verification_method=null so the dashboard surfaces a
 * "Reconnect Instagram" banner.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!instagramOAuthEnabled()) {
    return Response.json({ ok: true, skipped: "oauth_not_configured" });
  }

  const admin = getSupabaseAdminClient();
  const threshold = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await admin
    .from("artists")
    .select("id, instagram_token_encrypted, instagram_token_expires_at")
    .not("instagram_token_encrypted", "is", null)
    .lt("instagram_token_expires_at", threshold);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  let refreshed = 0;
  let revoked = 0;

  for (const row of rows ?? []) {
    const id = row.id as string;
    try {
      const current = decryptToken(row.instagram_token_encrypted as string);
      const next = await refreshLongLivedToken(current);
      const expiresAt = new Date(Date.now() + next.expires_in * 1000).toISOString();
      await admin
        .from("artists")
        .update({
          instagram_token_encrypted: encryptToken(next.access_token),
          instagram_token_expires_at: expiresAt,
        })
        .eq("id", id);
      refreshed++;
    } catch (err) {
      console.error(`[ig-refresh] artist ${id}: ${err instanceof Error ? err.message : err}`);
      // If the upstream rejected the token, clear it so the UI can prompt
      // re-connect. Leave `is_claimed=true` — they were verified, that
      // doesn't unverify itself just because the API connection lapsed.
      await admin
        .from("artists")
        .update({
          instagram_token_encrypted: null,
          instagram_token_expires_at: null,
        })
        .eq("id", id);
      revoked++;
    }
  }

  return Response.json({ ok: true, considered: rows?.length ?? 0, refreshed, revoked });
}
