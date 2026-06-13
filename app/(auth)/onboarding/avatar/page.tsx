import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

import { AvatarForm } from "./avatar-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile photo — onboarding" };

export default async function AvatarPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  if (!cookieStore.get("inkspot_handle")?.value) redirect("/onboarding");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, instagram_token_encrypted")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();
  if (!artist) redirect("/onboarding");

  const hasInstagramToken = Boolean(artist.instagram_token_encrypted);

  return (
    <OnboardingShell step={6} backHref="/onboarding/portfolio">
      <AvatarForm hasInstagramToken={hasInstagramToken} />
    </OnboardingShell>
  );
}
