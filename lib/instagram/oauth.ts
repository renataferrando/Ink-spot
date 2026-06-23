/**
 * Instagram Business / Creator OAuth (Graph API, `instagram_business_basic` scope).
 *
 * Endpoints — current as of 2026 (subject to Meta moving things around):
 *   - Authorize:                    https://www.instagram.com/oauth/authorize
 *   - Exchange code → short token:  https://api.instagram.com/oauth/access_token  (POST x-www-form-urlencoded)
 *   - Exchange short → long token:  https://graph.instagram.com/access_token        (GET)
 *   - Refresh long token:           https://graph.instagram.com/refresh_access_token (GET)
 *   - Read /me:                     https://graph.instagram.com/me                   (GET)
 *
 * Short-lived tokens last ~1 hour and must be swapped for long-lived (60 days)
 * immediately. Long-lived tokens are refreshable up to once a day.
 */

import { env } from "@/lib/validations/env";

const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_URL = "https://graph.instagram.com";
const SCOPE = "instagram_business_basic";

function requireConfig(): {
  appId: string;
  appSecret: string;
  redirectUri: string;
} {
  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET || !env.INSTAGRAM_REDIRECT_URI) {
    throw new Error("Instagram OAuth is not configured (missing INSTAGRAM_APP_ID/SECRET/REDIRECT_URI).");
  }
  return {
    appId: env.INSTAGRAM_APP_ID,
    appSecret: env.INSTAGRAM_APP_SECRET,
    redirectUri: env.INSTAGRAM_REDIRECT_URI,
  };
}

/**
 * Build the URL the user's browser is redirected to to start the OAuth dance.
 * `state` should be a random nonce the caller stores in a signed cookie and
 * verifies on the callback — it's our CSRF guard.
 */
export function buildAuthorizationUrl(state: string): string {
  const { appId, redirectUri } = requireConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface ShortLivedToken {
  access_token: string;
  user_id: number; // numeric IG user id
}

/** Exchange the one-shot ?code= from Meta's redirect for a short-lived (~1h) token. */
export async function exchangeCodeForShortLivedToken(code: string): Promise<ShortLivedToken> {
  const { appId, appSecret, redirectUri } = requireConfig();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram code exchange failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as ShortLivedToken;
  if (!json.access_token) {
    throw new Error("Instagram code exchange returned no access_token");
  }
  return json;
}

export interface LongLivedToken {
  access_token: string;
  /** Seconds until expiry. ~5_184_000 (~60 days) on issue. */
  expires_in: number;
  token_type: "bearer";
}

/** Swap a short-lived token for a long-lived one (~60 days, refreshable). */
export async function exchangeForLongLivedToken(shortToken: string): Promise<LongLivedToken> {
  const { appSecret } = requireConfig();
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: appSecret,
    access_token: shortToken,
  });
  const res = await fetch(`${GRAPH_URL}/access_token?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram long-lived token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as LongLivedToken;
}

/** Refresh a long-lived token (call when within ~14 days of expiry). */
export async function refreshLongLivedToken(longToken: string): Promise<LongLivedToken> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: longToken,
  });
  const res = await fetch(`${GRAPH_URL}/refresh_access_token?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram token refresh failed (${res.status}): ${text}`);
  }
  return (await res.json()) as LongLivedToken;
}

export interface InstagramMe {
  id: string;
  username: string;
  account_type: "BUSINESS" | "CREATOR" | "PERSONAL" | "MEDIA_CREATOR";
}

/** Fetch the authenticated user's profile to validate account type + username. */
export async function fetchMe(longToken: string): Promise<InstagramMe> {
  const params = new URLSearchParams({
    fields: "id,username,account_type",
    access_token: longToken,
  });
  const res = await fetch(`${GRAPH_URL}/me?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram /me failed (${res.status}): ${text}`);
  }
  return (await res.json()) as InstagramMe;
}

export interface InstagramMediaItem {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

export interface InstagramMediaPage {
  data: InstagramMediaItem[];
  paging?: { cursors?: { before: string; after: string }; next?: string };
}

/** Fetch the user's most recent media posts (images + carousels only). */
export async function fetchMedia(
  longToken: string,
  limit = 20,
): Promise<InstagramMediaPage> {
  const params = new URLSearchParams({
    fields: "id,media_type,media_url,thumbnail_url,caption,timestamp",
    limit: String(limit),
    access_token: longToken,
  });
  const res = await fetch(`${GRAPH_URL}/me/media?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram /me/media failed (${res.status}): ${text}`);
  }
  return (await res.json()) as InstagramMediaPage;
}
