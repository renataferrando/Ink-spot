import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { LocationForm } from "./location-form";

export const metadata: Metadata = { title: "Where do you tattoo?" };

export default async function LocationPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const handle = cookieStore.get("inkspot_handle")?.value;
  if (!handle) redirect("/onboarding");

  // Artists who skipped the IG handle land here directly from /onboarding —
  // send their back arrow to /onboarding, not /onboarding/verify.
  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("instagram_handle")
    .eq("handle", handle)
    .maybeSingle();

  const backHref = artist?.instagram_handle ? "/onboarding/verify" : "/onboarding";

  return (
    <OnboardingShell step={4} backHref={backHref}>
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
            Where do you <span style={{ color: "var(--accent)" }}>tattoo?</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: 0 }}>
            This puts your studio on the map for clients searching nearby.
          </p>
        </div>
        <LocationForm />
      </div>
    </OnboardingShell>
  );
}
