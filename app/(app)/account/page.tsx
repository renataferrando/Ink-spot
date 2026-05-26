import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClientUntyped as getSupabaseAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/actions/auth/sign-out";

export const metadata: Metadata = { title: "Account" };

const STEPS = [
  ["Email magic-link sign in", "No passwords. Just your inbox."],
  ["Verify your Instagram handle", "Drop a short code in your bio for 60 seconds."],
  ["Upload up to 30 photos", "Drag & drop. We classify styles automatically."],
  ["Set your home base + travel dates", "Be visible wherever you're guesting."],
] as const;

const SHELL_CLASS = "tab-shell scrollbar-none flex-1 overflow-y-auto px-[18px]";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Not authenticated ──────────────────────────────
  if (!user) {
    return (
      <div className={SHELL_CLASS}>
        <div className="mb-2">
          <h1 className="m-0 font-sans text-[30px] leading-[1.1] font-medium tracking-[-0.02em]">
            Are you the <span className="text-ink-spot">artist?</span>
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

        {/* CTA */}
        <Link href="/login" className="btn-primary mt-6 no-underline">
          Claim your profile <ArrowRight size={14} aria-hidden />
        </Link>

        <div className="h-4" />

        <div className="label">Or browse as a guest</div>
      </div>
    );
  }

  // ── Authenticated — check for artist row ──────────
  const admin = getSupabaseAdminClient();
  const { data: artist } = await admin
    .from("artists")
    .select("handle, display_name, is_claimed, primary_styles")
    .eq("claimed_by_user_id", user.id)
    .maybeSingle();

  // ── Authenticated, no artist ──────────────────────
  if (!artist) {
    return (
      <div className={SHELL_CLASS}>
        <div>
          <h1 className="mt-0 mb-2 text-[24px] font-medium tracking-[-0.02em]">
            Complete your profile
          </h1>
          <p className="text-dim m-0 text-[14px]">
            You&apos;re signed in but haven&apos;t set up your artist profile yet.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link href="/onboarding" className="btn-primary no-underline">
            Continue onboarding
            <ArrowRight size={14} aria-hidden />
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn-secondary w-full">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated, has artist ─────────────────────
  return (
    <div className={SHELL_CLASS}>
      {/* Mini profile header */}
      <div className="bg-surface border-hairline mb-4 rounded-[14px] border p-[18px]">
        <div className="text-[20px] font-medium tracking-[-0.01em]">
          {artist.display_name ?? `@${artist.handle}`}
        </div>
        <div className="label mt-1">@{artist.handle}</div>
        {!artist.is_claimed && (
          <div className="bg-demo-subtle text-demo mt-2.5 inline-block rounded-full border border-[rgba(251,191,36,0.2)] px-2.5 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase">
            Verification pending
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-0.5">
        {[
          { label: "View public profile", href: `/artist/${artist.handle}` },
          { label: "Manage portfolio", href: "/dashboard/portfolio" },
          { label: "Manage locations", href: "/dashboard/locations" },
          { label: "Full dashboard", href: "/dashboard" },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="border-hairline text-(--text) flex items-center justify-between border-b py-3.5 text-[15px] no-underline transition-colors"
          >
            {label}
            <ArrowRight size={15} className="text-faint" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="text-faint cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] tracking-[0.14em] uppercase"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
