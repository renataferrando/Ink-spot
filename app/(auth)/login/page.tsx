"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--r-md)",
  padding: "14px 16px",
  fontSize: 16,
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const monoLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains, ui-monospace)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--faint)",
  textDecoration: "none",
  transition: "color 0.15s",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

export default function LoginPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div
        style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          background: "var(--bg)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          {/* Icon halo */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "999px",
              background: "var(--surface-2)",
              border: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Mail size={20} style={{ color: "var(--accent)" }} />
          </div>

          <h1
            style={{
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: "0 0 10px",
            }}
          >
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: "0 0 20px" }}>
            We sent a sign-in link to{" "}
            <span style={{ color: "var(--text)", fontFamily: "var(--font-jetbrains, ui-monospace)" }}>
              {email}
            </span>
            . Click it to continue.
          </p>

          <button
            type="button"
            style={monoLinkStyle}
            onClick={() => setSent(false)}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dim)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--faint)")}
          >
            Didn&apos;t get it? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Wordmark */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-sans, ui-sans-serif)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--text)",
              position: "relative",
            }}
          >
            InkSpot
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 12px var(--accent-glow)",
                marginLeft: 4,
                transform: "translateY(-8px)",
              }}
            />
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: "0 0 8px",
            }}
          >
            Sign in as an artist
          </h1>
          <p style={{ fontSize: 14, color: "var(--dim)", margin: 0, lineHeight: 1.5 }}>
            Enter your email — we&apos;ll send a magic link. No password.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
            autoFocus
            disabled={loading}
            aria-label="Email address"
            style={{
              ...inputStyle,
              borderColor: focused ? "var(--accent)" : "var(--hairline)",
              boxShadow: focused ? "0 0 0 3px var(--accent-soft)" : "none",
              opacity: loading ? 0.6 : 1,
            }}
          />

          {error && (
            <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !email.trim()}
          >
            {loading ? "Sending…" : <>Continue <ArrowRight size={14} /></>}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/explore"
            style={monoLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dim)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--faint)")}
          >
            Explore artists without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
}
