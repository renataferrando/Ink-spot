import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

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

export default async function VerifyPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const handle = cookieStore.get("inkspot_handle")?.value;
  if (!handle) redirect("/onboarding");

  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("id, instagram_handle, is_claimed")
    .eq("handle", handle)
    .single();

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
      artist_id:         artist.id,
      instagram_user_id: user.id,
      instagram_handle:  artist.instagram_handle,
      status:            "pending",
      verification_code: code,
    });
  }

  return (
    <OnboardingShell step={3} backHref="/onboarding">
      <div className="space-y-5">
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
            Verify your{" "}
            <span style={{ color: "var(--accent)" }}>handle</span>.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--dim)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            Paste this code anywhere in your Instagram bio. We&apos;ll fetch
            the page and confirm. You can remove it 60&nbsp;seconds later.
          </p>
        </div>

        <VerifyForm
          handle={artist.instagram_handle}
          code={code ?? ""}
        />
      </div>
    </OnboardingShell>
  );
}
