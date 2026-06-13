import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { ensurePendingClaim } from "@/lib/claims/pending-claim";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { instagramOAuthEnabled } from "@/lib/validations/env";
import type { ArtistStyle } from "@/types/artist";
import { PageColumn } from "@/components/layout/page-container";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile" };

const OAUTH_ERROR_COPY: Record<string, string> = {
  state_mismatch: "Verification expired. Please try connecting Instagram again.",
  state_malformed: "Verification expired. Please try connecting Instagram again.",
  exchange_failed: "Instagram rejected our request. Please try again.",
  ig_already_connected: "Instagram re-authentication failed. Your account is already connected — no action needed.",
  personal_account:
    "That Instagram account is set to Personal. Switch it to Business or Creator in the Instagram app, then try again.",
  handle_mismatch:
    "That Instagram account doesn't match the handle on your InkSpot profile. Update your handle below, then try again.",
  persist_failed: "Something went wrong saving your verification. Please try again.",
  ig_user_denied: "You declined the Instagram permission. You can try again below.",
  missing_code: "Instagram didn't return an authorization code. Please try again.",
};

interface ProfilePageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { error: errorCode } = await searchParams;
  const oauthError = errorCode ? (OAUTH_ERROR_COPY[errorCode] ?? "Instagram connection failed.") : null;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select(
      `
      id, handle, display_name, bio,
      instagram_handle, profile_image_url, cover_image_url,
      website_url, contact_email, years_experience,
      primary_styles, is_active, is_claimed,
      verification_method, instagram_account_type,
      instagram_token_expires_at
    `,
    )
    .eq("claimed_by_user_id", user.id)
    .single();
  if (!artist) redirect("/onboarding");

  let verificationCode: string | null = null;
  if (!artist.is_claimed && artist.instagram_handle) {
    verificationCode = await ensurePendingClaim(
      admin,
      artist.id as string,
      user.id,
      artist.instagram_handle as string,
    );
  }

  return (
    <PageColumn className="py-8 lg:py-12">
      <Link
        href="/dashboard"
        className="text-dim hover:text-(--text) mb-5 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors"
      >
        <ChevronLeft size={14} aria-hidden />
        Dashboard
      </Link>

      <h1 className="mb-1.5 text-[32px] leading-[1.05] font-medium tracking-[-0.02em]">
        Edit <em className="text-ink-spot not-italic">profile</em>
      </h1>
      <p className="text-dim mb-7 text-[14px] leading-[1.55]">
        Update what visitors see on{" "}
        <span className="font-mono text-(--text)">/artist/{artist.handle}</span>.
      </p>

      {oauthError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-400"
        >
          {oauthError}
        </div>
      )}

      <ProfileForm
        oauthEnabled={instagramOAuthEnabled()}
        verificationCode={verificationCode}
        artist={{
          handle: artist.handle as string,
          display_name: (artist.display_name as string) ?? "",
          bio: (artist.bio as string | null) ?? "",
          instagram_handle: (artist.instagram_handle as string | null) ?? "",
          profile_image_url: (artist.profile_image_url as string | null) ?? null,
          cover_image_url: (artist.cover_image_url as string | null) ?? null,
          website_url: (artist.website_url as string | null) ?? "",
          contact_email: (artist.contact_email as string | null) ?? "",
          years_experience: (artist.years_experience as number | null) ?? null,
          primary_styles: ((artist.primary_styles as ArtistStyle[] | null) ?? []) as ArtistStyle[],
          is_active: artist.is_active !== false,
          is_claimed: artist.is_claimed === true,
          verification_method: (artist.verification_method as
            | "bio_code"
            | "instagram_oauth"
            | null) ?? null,
          instagram_account_type: (artist.instagram_account_type as
            | "BUSINESS"
            | "CREATOR"
            | "PERSONAL"
            | null) ?? null,
          instagram_token_expires_at:
            (artist.instagram_token_expires_at as string | null) ?? null,
        }}
      />
    </PageColumn>
  );
}
