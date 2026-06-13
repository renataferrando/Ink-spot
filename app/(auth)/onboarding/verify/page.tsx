import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ensurePendingClaim } from "@/lib/claims/pending-claim";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { InstagramVerificationPanel } from "@/components/artist/instagram-verification-panel";
import { accentWordClass } from "@/lib/ui/field-classes";
import { instagramOAuthEnabled } from "@/lib/validations/env";

export const metadata: Metadata = { title: "Verify your Instagram" };

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
  if (!artist.instagram_handle) redirect("/dashboard/profile");

  const code = await ensurePendingClaim(
    admin,
    artist.id,
    user.id,
    artist.instagram_handle as string,
  );

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

        <InstagramVerificationPanel
          oauthEnabled={oauthEnabled}
          next="/onboarding/verify"
          handle={artist.instagram_handle as string}
          code={code}
          errorMessage={errorMessage}
        />
      </div>
    </OnboardingShell>
  );
}
