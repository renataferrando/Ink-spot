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

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Not authenticated ──────────────────────────────
  if (!user) {
    return (
      <div
        className="dt-tab-shell flex-1 overflow-y-auto scrollbar-none"
        style={{ padding: "0 18px 32px" }}
      >
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <h1
            style={{
              fontFamily: "var(--font-sans, ui-sans-serif)",
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Are you the{" "}
            <span style={{ color: "var(--accent)" }}>artist?</span>
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: "8px 0 0" }}>
          Claim your profile, upload your portfolio, and show up in AI search results across Costa Rica.
        </p>

        {/* Steps */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 0 }}>
          {STEPS.map(([title, sub], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: "14px 0",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "var(--surface-2)",
                  border: "1px solid var(--hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono, ui-monospace)",
                  fontSize: 11,
                  color: "var(--accent)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/login"
          className="btn-primary"
          style={{ marginTop: 24, textDecoration: "none" }}
        >
          Claim your profile{" "}
          <ArrowRight size={14} aria-hidden />
        </Link>

        <div style={{ height: 16 }} />

        <div className="label" style={{ textTransform: "uppercase" }}>
          Or browse as a guest
        </div>
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
      <div
        className="dt-tab-shell flex-1 overflow-y-auto scrollbar-none"
        style={{ padding: "0 18px 32px" }}
      >
        <div style={{ marginTop: 12 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
            }}
          >
            Complete your profile
          </h1>
          <p style={{ fontSize: 14, color: "var(--dim)", margin: 0 }}>
            You&apos;re signed in but haven&apos;t set up your artist profile yet.
          </p>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <Link
            href="/onboarding"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Continue onboarding
            <ArrowRight size={14} aria-hidden />
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn-secondary" style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Authenticated, has artist ─────────────────────
  return (
    <div
      className="dt-tab-shell flex-1 overflow-y-auto scrollbar-none"
      style={{ padding: "0 18px 32px" }}
    >
      {/* Mini profile header */}
      <div
        style={{
          marginTop: 12,
          padding: "18px",
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}>
          {artist.display_name ?? `@${artist.handle}`}
        </div>
        <div
          className="label"
          style={{ marginTop: 4 }}
        >
          @{artist.handle}
        </div>
        {!artist.is_claimed && (
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 999,
              fontSize: 11,
              color: "#fbbf24",
              fontFamily: "var(--font-mono, ui-monospace)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              display: "inline-block",
            }}
          >
            Verification pending
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[
          { label: "View public profile", href: `/artist/${artist.handle}` },
          { label: "Manage portfolio",    href: "/dashboard/portfolio"      },
          { label: "Manage locations",    href: "/dashboard/locations"      },
          { label: "Full dashboard",      href: "/dashboard"                },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid var(--hairline)",
              fontSize: 15,
              color: "var(--text)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            {label}
            <ArrowRight size={15} style={{ color: "var(--faint)" }} />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <form action={signOut} style={{ marginTop: 24 }}>
        <button
          type="submit"
          style={{
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--faint)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
