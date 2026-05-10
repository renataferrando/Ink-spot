"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

import { IgPreviewCard } from "@/components/artist/ig-preview-card";
import { verifyOwnership, submitManualReview } from "@/actions/artist/verify-ownership";

interface Props {
  handle: string;
  code: string;
}

export function VerifyForm({ handle, code }: Props) {
  const [stage, setStage]         = useState<"paste" | "checking" | "verified">("paste");
  const [copied, setCopied]       = useState(false);
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
      const res  = await fetch(`/api/onboarding/check-bio?handle=${encodeURIComponent(handle)}&code=${encodeURIComponent(code)}`);
      const json = await res.json() as { verified: boolean };
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
      {/* Code box */}
      <div className="code-box">
        <span className="code">{code}</span>
        <button
          type="button"
          onClick={copyCode}
          style={{
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: copied ? "var(--accent)" : "var(--dim)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "color 0.2s",
          }}
        >
          {copied ? (
            <><CheckCircle2 size={12} /> Copied</>
          ) : (
            <><Copy size={12} /> Copy</>
          )}
        </button>
      </div>

      {/* IG preview card */}
      <IgPreviewCard handle={handle} verified={stage === "verified"} />

      {/* CTA — changes per stage */}
      {stage === "paste" && (
        <button className="btn-primary" type="button" onClick={handleCheck}>
          I&apos;ve added the code
        </button>
      )}
      {stage === "checking" && (
        <button className="btn-primary" type="button" disabled>
          <span style={{ opacity: 0.8 }}>Fetching instagram.com/{handle}…</span>
        </button>
      )}
      {stage === "verified" && (
        <button className="btn-primary" type="button" onClick={handleContinue}>
          Continue → Add location
        </button>
      )}

      {checkError && (
        <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{checkError}</p>
      )}

      {/* Manual review link */}
      {stage !== "verified" && (
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            style={{
              fontFamily: "var(--font-mono, ui-monospace)",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--faint)",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dim)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--faint)")}
          >
            Or request manual review →
          </button>
        </div>
      )}

      {/* Inline manual review form */}
      {showManual && stage !== "verified" && (
        <div
          style={{
            marginTop: 4,
            padding: "18px",
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 12,
          }}
        >
          {manualSent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <CheckCircle2 size={28} style={{ color: "var(--accent)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>Request received</p>
              <p style={{ fontSize: 12, color: "var(--dim)", margin: 0, lineHeight: 1.5 }}>
                We&apos;ll review within 24 h and email you when approved.
              </p>
            </div>
          ) : (
            <form action={manualAction} className="space-y-3">
              <p style={{ fontSize: 13, color: "var(--dim)", margin: 0, lineHeight: 1.5 }}>
                Can&apos;t edit your bio right now? We&apos;ll verify manually.
              </p>
              <div>
                <label
                  htmlFor="contact"
                  className="label"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Contact (email or WhatsApp) *
                </label>
                <input
                  id="contact"
                  name="contact"
                  placeholder="you@email.com"
                  required
                  disabled={manualPending}
                  style={{
                    width: "100%",
                    background: "var(--surface-2)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 14,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="note"
                  className="label"
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Note (optional)
                </label>
                <input
                  id="note"
                  name="note"
                  placeholder="Any context that helps us verify…"
                  disabled={manualPending}
                  style={{
                    width: "100%",
                    background: "var(--surface-2)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 14,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
              </div>
              {manualState?.error && (
                <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{manualState.error}</p>
              )}
              <button
                type="submit"
                disabled={manualPending}
                className="btn-primary"
                style={{ marginTop: 4 }}
              >
                {manualPending ? "Submitting…" : "Request review"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
