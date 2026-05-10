import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your studio" };

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already has a profile → go to dashboard
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
        <div className="space-y-2">
          <h1
            style={{
              fontFamily: "var(--font-sans, ui-sans-serif)",
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Set up your <span style={{ color: "var(--accent)" }}>studio</span>.
          </h1>
          <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: 0 }}>
            Tell us about your work. You can update everything later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </OnboardingShell>
  );
}
