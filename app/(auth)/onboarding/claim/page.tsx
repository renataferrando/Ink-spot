import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export const metadata: Metadata = { title: "Claim your studio" };

async function claimDemo(formData: FormData) {
  "use server";
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const demoHandle = cookieStore.get("inkspot_demo_handle")?.value;
  const igHandle = cookieStore.get("inkspot_pending_ig")?.value;
  if (!demoHandle) redirect("/onboarding");

  const admin = getSupabaseAdminClient();
  await admin
    .from("artists")
    .update({
      is_demo: false,
      is_claimed: false, // will become true after bio verification
      claimed_by_user_id: user.id,
    })
    .eq("handle", demoHandle)
    .eq("is_demo", true);

  cookieStore.set("inkspot_handle", demoHandle, { httpOnly: true, path: "/", maxAge: 86400 });
  cookieStore.delete("inkspot_demo_handle");
  cookieStore.delete("inkspot_pending_studio");

  redirect(igHandle ? "/onboarding/verify" : "/onboarding/location");
}

async function declineClaim() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete("inkspot_demo_handle");
  cookieStore.delete("inkspot_pending_studio");
  cookieStore.delete("inkspot_pending_ig");
  redirect("/onboarding");
}

export default async function ClaimPage() {
  const cookieStore = await cookies();
  const demoHandle = cookieStore.get("inkspot_demo_handle")?.value;
  const studioName = cookieStore.get("inkspot_pending_studio")?.value;
  const igHandle = cookieStore.get("inkspot_pending_ig")?.value;

  if (!demoHandle || !igHandle) redirect("/onboarding");

  const admin = getSupabaseAdminClient();
  const { data: demo } = await admin
    .from("artists")
    .select("display_name, profile_image_url")
    .eq("handle", demoHandle)
    .single();

  return (
    <OnboardingShell step={2} backHref="/onboarding">
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          {/* Avatar initials */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "999px",
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--text-2)",
              margin: "0 auto",
            }}
          >
            {(demo?.display_name ?? studioName ?? "?").slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                margin: "0 0 8px",
                color: "var(--text)",
              }}
            >
              Is this your studio?
            </h1>
            <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: 0 }}>
              We found a placeholder profile for{" "}
              <span style={{ color: "var(--text)", fontFamily: "var(--font-mono, ui-monospace)" }}>
                @{igHandle}
              </span>
              . Claim it to unlock the full profile.
            </p>
          </div>

          <div
            style={{
              padding: "10px 16px",
              background: "var(--surface)",
              border: "1px solid var(--hairline)",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text)",
            }}
          >
            {demo?.display_name ?? studioName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <form action={claimDemo}>
            <button type="submit" className="btn-primary">
              Yes, claim it
            </button>
          </form>
          <form action={declineClaim}>
            <button
              type="submit"
              className="btn-secondary"
              style={{ width: "100%", color: "var(--dim)" }}
            >
              No, use a different handle
            </button>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
