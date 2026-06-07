import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthorizationUrl } from "@/lib/instagram/oauth";
import { instagramOAuthEnabled } from "@/lib/validations/env";

/**
 * Kick off the Instagram Business OAuth dance.
 *
 * Query params:
 *   - `next` (optional) — relative path to return to after success.
 *     Defaults to `/onboarding/location` (mid-onboarding).
 *
 * Sets a short-lived `inkspot_ig_state` cookie carrying a CSRF nonce + the
 * `next` destination. The cookie is httpOnly + sameSite=lax so it survives
 * the round-trip through instagram.com but isn't readable by client JS.
 */
export async function GET(request: Request) {
  if (!instagramOAuthEnabled()) {
    return new NextResponse("Instagram OAuth is not configured", { status: 501 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/onboarding/verify");
    return NextResponse.redirect(loginUrl);
  }

  // Guard against open-redirect: `next` must be a relative path on our site.
  const url = new URL(request.url);
  const rawNext = url.searchParams.get("next") ?? "/onboarding/location";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/onboarding/location";

  const nonce = randomBytes(16).toString("hex");
  const statePayload = JSON.stringify({ n: nonce, u: user.id, r: next });
  // The cookie carries the nonce we'll compare against the `state` query
  // param Meta sends back. We send the same JSON as the OAuth state value
  // so the callback can recover `next` and `user.id` even if the user's
  // Supabase session expired during the IG round-trip.
  const cookieStore = await cookies();
  cookieStore.set("inkspot_ig_state", statePayload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  const authorize = buildAuthorizationUrl(statePayload);
  return NextResponse.redirect(authorize);
}
