"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

import { IgPreviewCard } from "@/components/artist/ig-preview-card";
import { verifyOwnership, submitManualReview } from "@/actions/artist/verify-ownership";
import {
  copyCodeButtonClass,
  fieldErrorClass,
  fieldInputSmClass,
  ghostTextButtonClass,
  surfacePanelClass,
} from "@/lib/ui/field-classes";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, codeBoxClass, codeTextClass, labelClass } from "@/lib/ui/classes";

interface Props {
  handle: string;
  code: string;
}

export function VerifyForm({ handle, code }: Props) {
  const [stage, setStage] = useState<"paste" | "checking" | "verified">("paste");
  const [copied, setCopied] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualSent, setManualSent] = useState(false);

  const [manualState, manualAction, manualPending] = useActionState<
    { error?: string } | null,
    FormData
  >(async (_prev, fd) => {
    const result = await submitManualReview(fd);
    if (!result.error) setManualSent(true);
    return result;
  }, null);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCheck() {
    setStage("checking");
    setCheckError(null);
    try {
      const res = await fetch(
        `/api/onboarding/check-bio?handle=${encodeURIComponent(handle)}&code=${encodeURIComponent(code)}`,
      );
      const json = (await res.json()) as { verified: boolean };
      if (json.verified) {
        setStage("verified");
      } else {
        setCheckError("Code not found in bio yet. Make sure you saved and try again.");
        setStage("paste");
      }
    } catch {
      setCheckError("Something went wrong. Please try again.");
      setStage("paste");
    }
  }

  async function handleContinue() {
    await verifyOwnership();
  }

  return (
    <div className="space-y-4">
      <div className={codeBoxClass}>
        <span className={codeTextClass}>{code}</span>
        <button type="button" onClick={copyCode} className={copyCodeButtonClass(copied)}>
          {copied ? (
            <>
              <CheckCircle2 size={12} aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy size={12} aria-hidden /> Copy
            </>
          )}
        </button>
      </div>

      <IgPreviewCard handle={handle} verified={stage === "verified"} />

      {stage === "paste" && (
        <button className={btnPrimaryClass} type="button" onClick={handleCheck}>
          I&apos;ve added the code
        </button>
      )}
      {stage === "checking" && (
        <button className={btnPrimaryClass} type="button" disabled>
          <span className="opacity-80">Fetching instagram.com/{handle}…</span>
        </button>
      )}
      {stage === "verified" && (
        <button className={btnPrimaryClass} type="button" onClick={handleContinue}>
          Continue → Add location
        </button>
      )}

      {checkError && <p className={fieldErrorClass}>{checkError}</p>}

      {stage !== "verified" && (
        <div className="text-center">
          <button type="button" onClick={() => setShowManual((v) => !v)} className={ghostTextButtonClass}>
            Or request manual review →
          </button>
        </div>
      )}

      {showManual && stage !== "verified" && (
        <div className={cn(surfacePanelClass, "mt-1")}>
          {manualSent ? (
            <div className="py-2 text-center">
              <CheckCircle2 size={28} className="text-ink-spot mx-auto mb-2" aria-hidden />
              <p className="m-0 mb-1 text-sm font-medium text-(--text)">Request received</p>
              <p className="text-dim m-0 text-xs leading-normal">
                We&apos;ll review within 24 h and email you when approved.
              </p>
            </div>
          ) : (
            <form action={manualAction} className="space-y-3">
              <p className="text-dim m-0 text-[13px] leading-normal">
                Can&apos;t edit your bio right now? We&apos;ll verify manually.
              </p>
              <div>
                <label htmlFor="contact" className={cn(labelClass, "mb-1.5 block")}>
                  Contact (email or WhatsApp) *
                </label>
                <input
                  id="contact"
                  name="contact"
                  placeholder="you@email.com"
                  required
                  disabled={manualPending}
                  className={fieldInputSmClass}
                />
              </div>
              <div>
                <label htmlFor="note" className={cn(labelClass, "mb-1.5 block")}>
                  Note (optional)
                </label>
                <input
                  id="note"
                  name="note"
                  placeholder="Any context that helps us verify…"
                  disabled={manualPending}
                  className={fieldInputSmClass}
                />
              </div>
              {manualState?.error && <p className={fieldErrorClass}>{manualState.error}</p>}
              <button type="submit" disabled={manualPending} className={cn(btnPrimaryClass, "mt-1")}>
                {manualPending ? "Submitting…" : "Request review"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
