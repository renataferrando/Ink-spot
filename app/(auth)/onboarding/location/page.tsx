import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingHeading } from "@/components/onboarding/onboarding-heading";
import { accentWordClass } from "@/lib/ui/field-classes";
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
        <OnboardingHeading
          title={
            <>
              Where do you <span className={accentWordClass}>tattoo?</span>
            </>
          }
          lead="This puts your studio on the map for clients searching nearby."
        />
        <LocationForm />
      </div>
    </OnboardingShell>
  );
}
