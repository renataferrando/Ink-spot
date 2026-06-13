"use client";

import { useActionState, useState } from "react";

import {
  startInstagramVerification,
  type StartInstagramVerificationState,
} from "@/actions/artist/start-instagram-verification";
import { InstagramConnectButton } from "@/components/onboarding/instagram-connect-button";
import { VerifyForm } from "@/app/(auth)/onboarding/verify/verify-form";
import { cn } from "@/lib/utils";
import { btnPrimaryMd } from "@/lib/ui/classes";
import { fieldErrorClass, fieldHintClass, fieldInputClass } from "@/lib/ui/field-classes";

interface InstagramVerificationPanelProps {
  oauthEnabled: boolean;
  /** Relative path for InstagramConnectButton after OAuth. */
  next: string;
  handle?: string | null;
  code?: string | null;
  errorMessage?: string | null;
  /** Bio section shows handle entry before the code flow. */
  requireHandleEntry?: boolean;
  verifyContinueLabel?: string;
  verifyRedirectTo?: string;
}

export function InstagramVerificationPanel({
  oauthEnabled,
  next,
  handle: initialHandle,
  code: initialCode,
  errorMessage,
  requireHandleEntry = false,
  verifyContinueLabel,
  verifyRedirectTo,
}: InstagramVerificationPanelProps) {
  const [bioHandle, setBioHandle] = useState(initialHandle ?? "");

  const [startState, startAction, startPending] = useActionState<
    StartInstagramVerificationState,
    FormData
  >(startInstagramVerification, {});

  const verifyHandle =
    startState.success && startState.handle
      ? startState.handle
      : !requireHandleEntry
        ? initialHandle
        : null;
  const verifyCode =
    startState.success && startState.code
      ? startState.code
      : !requireHandleEntry
        ? initialCode
        : null;

  const verifyData = verifyHandle && verifyCode ? { handle: verifyHandle, code: verifyCode } : null;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-400"
        >
          {errorMessage}
        </div>
      )}

      {oauthEnabled && (
        <section
          className="border-hairline bg-surface space-y-3 rounded-xl border p-5"
          aria-label="Connect Instagram Business"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-(--text) text-sm font-medium">Option 1 · Instagram Business</h2>
            <span className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">
              Fastest
            </span>
          </div>
          <p className="text-dim text-xs leading-relaxed">
            If your Instagram is set to <strong className="text-text-2">Business</strong> or{" "}
            <strong className="text-text-2">Creator</strong>, sign in once and you&apos;re verified.
            We never post on your behalf — read-only access to confirm the account is yours.
          </p>
          <InstagramConnectButton next={next} label="Connect Instagram" />
        </section>
      )}

      <section
        className="border-hairline bg-surface space-y-3 rounded-xl border p-5"
        aria-label="Verify via bio code"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-(--text) text-sm font-medium">
            {oauthEnabled ? "Option 2 · Bio code" : "Verify with a bio code"}
          </h2>
          <span className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">
            Works for personal
          </span>
        </div>
        <p className="text-dim text-xs leading-relaxed">
          {verifyData ? (
            <>
              Paste this code anywhere in your Instagram bio. We&apos;ll fetch the page and confirm.
              You can remove it 60&nbsp;seconds later.
            </>
          ) : (
            <>
              Enter your handle, then paste a one-time code in your bio. Works for personal accounts
              too.
            </>
          )}
        </p>

        {verifyData ? (
          <VerifyForm
            handle={verifyData.handle}
            code={verifyData.code}
            continueLabel={verifyContinueLabel}
            redirectTo={verifyRedirectTo}
          />
        ) : (
          <form action={startAction} className="space-y-3">
            <div>
              <label htmlFor="panel_ig_handle" className="sr-only">
                Instagram handle
              </label>
              <div className="relative">
                <span className="text-dim pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[14px]">
                  @
                </span>
                <input
                  id="panel_ig_handle"
                  name="instagram_handle"
                  type="text"
                  required
                  maxLength={30}
                  pattern="[a-zA-Z0-9_.]*"
                  value={bioHandle}
                  onChange={(e) => setBioHandle(e.target.value.replace(/^@/, ""))}
                  disabled={startPending}
                  placeholder="yourstudio"
                  className={cn(fieldInputClass, "pl-8")}
                />
              </div>
              <p className={fieldHintClass}>Letters, numbers, underscores, and periods only.</p>
            </div>
            {startState.error && <p className={fieldErrorClass}>{startState.error}</p>}
            <button
              type="submit"
              disabled={startPending || !bioHandle.trim()}
              className={cn(btnPrimaryMd, "lg:w-auto lg:px-12")}
            >
              {startPending ? "Saving…" : "Get verification code"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
