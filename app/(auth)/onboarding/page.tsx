import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { accentWordClass } from "@/lib/ui/field-classes";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your studio" };

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("handle")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();
  if (artist) redirect("/dashboard");

  return (
    <OnboardingShell step={1} backHref="/explore">
      <div className="space-y-6">
        <OnboardingHeading
          title={
            <>
              Set up your <span className={accentWordClass}>studio</span>.
            </>
          }
          lead="Tell us about your work. You can update everything later."
        />
        <OnboardingForm />
      </div>
    </OnboardingShell>
  );
}
