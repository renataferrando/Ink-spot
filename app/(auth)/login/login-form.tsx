"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fieldErrorClass, fieldInputClass, ghostTextButtonClass } from "@/lib/ui/field-classes";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, pageColumnClass, pageGutterClass } from "@/lib/ui/classes";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex min-h-svh flex-col items-center justify-center bg-(--bg)">
        <div className={cn(pageColumnClass, pageGutterClass, "w-full text-center")}>
          <div className="bg-surface-2 border-hairline mx-auto mb-5 flex size-[52px] items-center justify-center rounded-full border">
            <Mail size={20} className="text-ink-spot" aria-hidden />
          </div>

          <h1 className="m-0 mb-2.5 text-[30px] leading-[1.1] font-medium tracking-[-0.02em] text-(--text)">
            Check your email
          </h1>
          <p className="text-dim m-0 mb-5 text-[14px] leading-[1.55]">
            We sent a sign-in link to{" "}
            <span className="font-mono text-(--text)">{email}</span>. Click it to continue.
          </p>

          <button type="button" className={ghostTextButtonClass} onClick={() => setSent(false)}>
            Didn&apos;t get it? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-(--bg)">
      <div className={cn(pageColumnClass, pageGutterClass, "w-full")}>
        <div className="mb-9 text-center">
          <span className="relative inline-block font-sans text-[22px] font-medium tracking-[-0.01em] text-(--text)">
            InkSpot
            <span
              aria-hidden
              className="bg-ink-spot ml-1 inline-block size-1.5 -translate-y-2 rounded-full shadow-[0_0_12px_var(--accent-glow)]"
            />
          </span>
        </div>

        <div className="mb-7 text-center">
          <h1 className="m-0 mb-2 text-[26px] font-medium tracking-[-0.02em] text-(--text)">
            Sign in as an artist
          </h1>
          <p className="text-dim m-0 text-[14px] leading-normal">
            Enter your email — we&apos;ll send a magic link. No password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            disabled={loading}
            aria-label="Email address"
            className={fieldInputClass}
          />

          {error && <p className={fieldErrorClass}>{error}</p>}

          <button type="submit" className={btnPrimaryClass} disabled={loading || !email.trim()}>
            {loading ? (
              "Sending…"
            ) : (
              <>
                Continue <ArrowRight size={14} aria-hidden />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/explore" className={cn(ghostTextButtonClass, "no-underline")}>
            Explore artists without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
}
