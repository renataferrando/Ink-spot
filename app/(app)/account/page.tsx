import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/actions/auth/sign-out";
import { cn } from "@/lib/utils";
import { btnPrimaryLg, btnSecondaryLg, labelClass, tabShellClass, scrollbarNoneClass } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

const STEPS = [
  ["Email magic-link sign in", "No passwords. Just your inbox."],
  ["Verify your Instagram handle", "Drop a short code in your bio for 60 seconds."],
  ["Upload up to 30 photos", "Drag & drop. We classify styles automatically."],
  ["Set your home base + travel dates", "Be visible wherever you're guesting."],
] as const;

const SHELL_CLASS = cn(tabShellClass, scrollbarNoneClass, "flex-1 overflow-y-auto");

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Not authenticated ──────────────────────────────
  if (!user) {
    return (
      <div className={SHELL_CLASS}>
        {/* Artist path */}
        <div className="mb-2">
          <h1 className="m-0 font-sans text-[30px] leading-[1.1] font-medium tracking-[-0.02em]">
            Are you an <span className="text-ink-spot">artist?</span>
          </h1>
        </div>
        <p className="text-dim mt-2 text-[14px] leading-[1.55]">
          Claim your profile, upload your portfolio, and show up in AI search results across Costa
          Rica.
        </p>

        {/* Steps */}
        <div className="mt-6 flex flex-col">
          {STEPS.map(([title, sub], i) => (
            <div key={i} className="border-hairline flex gap-3.5 border-b py-3.5">
              <div className="bg-surface-2 border-hairline text-ink-spot flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]">
                {i + 1}
              </div>
              <div>
                <div className="text-(--text) text-[16px] font-medium">{title}</div>
                <div className="text-dim mt-0.5 text-[12px]">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <Link href="/login?intent=artist" className={cn(btnPrimaryLg, "mt-6")}>
          Claim your profile <ArrowRight size={14} aria-hidden />
        </Link>

        {/* Fan path */}
        <div className="border-hairline mt-8 border-t pt-6">
          <p className="text-(--text) text-[16px] font-medium leading-snug">Just here to explore?</p>
          <p className="text-dim mt-1 text-[13px] leading-[1.55]">
            Save your favorite artists and get notified when they visit.
          </p>
          <Link href="/login?intent=fan" className={cn(btnSecondaryLg, "mt-4")}>
            Save your favorite artists <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Returning users */}
        <div className="mt-6 text-center">
          <Link href="/login" className={cn(labelClass, "no-underline hover:text-(--text) transition-colors")}>
            Already have an account? Sign in
          </Link>
        </div>

        <div className="mt-3 text-center">
          <div className={labelClass}>Or browse as a guest</div>
        </div>
      </div>
    );
  }

  // ── Authenticated — check for artist row ──────────
  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("handle, display_name, is_claimed, is_active, primary_styles")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();

  // ── Authenticated, no artist ──────────────────────
  if (!artist) {
    return (
      <div className={SHELL_CLASS}>
        <div>
          <h1 className="mt-0 mb-2 text-[24px] font-medium tracking-[-0.02em]">Account</h1>
          <p className="text-dim m-0 text-[14px]">{user.email}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <form action={signOut}>
            <button type="submit" className={cn(btnSecondaryLg, "w-full")}>
              Sign out
            </button>
          </form>
        </div>

        <div className="border-hairline mt-8 border-t pt-6">
          <p className="text-dim text-[13px] leading-[1.55]">
            Want to list your studio?
          </p>
          <Link href="/onboarding" className={cn(btnPrimaryLg, "mt-3")}>
            Claim your artist profile <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  // ── Authenticated, has artist → go straight to dashboard ─────────────────
  redirect("/dashboard");
}
