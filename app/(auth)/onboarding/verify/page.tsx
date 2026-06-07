import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { accentWordClass } from "@/lib/ui/field-classes";
import { instagramOAuthEnabled } from "@/lib/validations/env";
import { InstagramConnectButton } from "@/components/onboarding/instagram-connect-button";

import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your Instagram" };

function generateCode() {
  // Format: INK-{4 uppercase hex} e.g. INK-9F2A
  return (
    "INK-" +
    Array.from(crypto.getRandomValues(new Uint8Array(2)))
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

interface VerifyPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_COPY: Record<string, string> = {
  state_mismatch: "Verification expired. Please try connecting Instagram again.",
  state_malformed: "Verification expired. Please try connecting Instagram again.",
  exchange_failed: "Instagram rejected our request. Please try again.",
  ig_already_connected: "Instagram re-authentication failed. Your account is already connected — no action needed.",
  personal_account:
    "That Instagram account is set to Personal. Switch it to Business or Creator in the Instagram app, or use the bio-code option below.",
  handle_mismatch:
    "That Instagram account doesn't match the handle on your InkSpot profile. Update your handle in Edit profile, then try again.",
  no_artist: "We couldn't find your artist profile.",
  persist_failed: "Something went wrong saving your verification. Please try again.",
  ig_user_denied: "You declined the Instagram permission. You can try again or use the bio-code option below.",
  ig_not_configured: "Instagram OAuth isn't available right now. Please use the bio-code option below.",
  missing_code: "Instagram didn't return an authorization code. Please try again.",
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { error: errorCode } = await searchParams;
  const errorMessage = errorCode ? (ERROR_COPY[errorCode] ?? "Instagram verification failed.") : null;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const cookieHandle = cookieStore.get("inkspot_handle")?.value;

  const admin = getSupabaseAdminClient();

  // Prefer the onboarding cookie; fall back to the artist claimed by this user
  // so returning artists whose cookie expired can still reach this page.
  const { data: artist } = cookieHandle
    ? await admin
        .from("artists")
        .select("id, instagram_handle, is_claimed")
        .eq("handle", cookieHandle)
        .single()
    : await admin
        .from("artists")
        .select("id, instagram_handle, is_claimed")
        .eq("claimed_by_user_id", user.id)
        .maybeSingle();

  if (!artist) redirect("/onboarding");
  if (artist.is_claimed) redirect("/onboarding/location");
  if (!artist.instagram_handle) redirect("/onboarding/location");

  // Get or create a pending claim with a verification code
  const { data: existing } = await admin
    .from("claims")
    .select("id, verification_code")
    .eq("artist_id", artist.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let code = existing?.verification_code;

  if (!existing) {
    code = generateCode();
    await admin.from("claims").insert({
      artist_id: artist.id,
      instagram_user_id: user.id,
      instagram_handle: artist.instagram_handle,
      status: "pending",
      verification_code: code,
    });
  }

  const oauthEnabled = instagramOAuthEnabled();

  return (
    <OnboardingShell step={3} backHref="/onboarding">
      <div className="space-y-5">
        <OnboardingHeading
          title={
            <>
              Verify your <span className={accentWordClass}>handle</span>.
            </>
          }
          lead={
            <>
              Two ways to verify ownership of{" "}
              <span className="text-text-2 font-mono">@{artist.instagram_handle}</span>. Pick whichever
              works for your account.
            </>
          }
        />

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-400"
          >
            {errorMessage}
          </div>
        )}

        {oauthEnabled && (
          <section
            className="border-hairline bg-surface space-y-3 rounded-xl border p-5"
            aria-label="Connect Instagram Business"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-(--text) text-sm font-medium">Option 1 · Instagram Business</h2>
              <span className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">
                Fastest
              </span>
            </div>
            <p className="text-dim text-xs leading-relaxed">
              If your Instagram is set to <strong className="text-text-2">Business</strong> or{" "}
              <strong className="text-text-2">Creator</strong>, sign in once and you&apos;re verified.
              We never post on your behalf — read-only access to confirm the account is yours.
            </p>
            <InstagramConnectButton next="/onboarding/verify" label="Connect Instagram" />
          </section>
        )}

        <section
          className="border-hairline bg-surface space-y-3 rounded-xl border p-5"
          aria-label="Verify via bio code"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-(--text) text-sm font-medium">
              {oauthEnabled ? "Option 2 · Bio code" : "Verify with a bio code"}
            </h2>
            <span className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">
              Works for personal
            </span>
          </div>
          <p className="text-dim text-xs leading-relaxed">
            Paste this code anywhere in your Instagram bio. We&apos;ll fetch the page and confirm. You can
            remove it 60&nbsp;seconds later.
          </p>
          <VerifyForm handle={artist.instagram_handle} code={code ?? ""} />
        </section>
      </div>
    </OnboardingShell>
  );
}
