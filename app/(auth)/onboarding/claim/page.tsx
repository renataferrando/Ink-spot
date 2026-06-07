import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, btnSecondaryClass } from "@/lib/ui/classes";

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
          <div className="bg-surface-2 border-hairline text-text-2 mx-auto flex size-16 items-center justify-center rounded-full border text-[22px] font-medium">
            {(demo?.display_name ?? studioName ?? "?").slice(0, 2).toUpperCase()}
          </div>

          <div>
            <h1 className="m-0 mb-2 text-[26px] font-medium tracking-[-0.02em] text-(--text)">
              Is this your studio?
            </h1>
            <p className="text-dim m-0 text-[14px] leading-[1.55]">
              We found a placeholder profile for{" "}
              <span className="font-mono text-(--text)">@{igHandle}</span>. Claim it to unlock the
              full profile.
            </p>
          </div>

          <div className="bg-surface border-hairline rounded-(--r-sm) border px-4 py-2.5 text-[15px] font-medium text-(--text)">
            {demo?.display_name ?? studioName}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <form action={claimDemo}>
            <button type="submit" className={btnPrimaryClass}>
              Yes, claim it
            </button>
          </form>
          <form action={declineClaim}>
            <button type="submit" className={cn(btnSecondaryClass, "text-dim w-full")}>
              No, use a different handle
            </button>
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
