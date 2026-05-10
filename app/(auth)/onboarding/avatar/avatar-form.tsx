"use client";

import { useActionState } from "react";

import { saveOnboardingAppearance, skipOnboardingAppearance } from "@/actions/artist/update-avatar";

export function AvatarForm() {
  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: { error?: string } | null, fd: FormData) => saveOnboardingAppearance(fd),
    null,
  );

  const pending = savePending;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1
          style={{
            fontFamily: "var(--font-sans, ui-sans-serif)",
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Your <span style={{ color: "var(--accent)" }}>look</span>
        </h1>
        <p style={{ fontSize: 14, color: "var(--dim)", lineHeight: 1.55, margin: 0 }}>
          Add a profile photo and optional cover for your public page — or skip and we&apos;ll use
          your first portfolio image where possible.
        </p>
      </div>

      <form action={saveAction} className="space-y-5">
        <div>
          <label className="label" style={{ display: "block", marginBottom: 8 }}>
            Profile photo
          </label>
          <input
            name="avatar"
            type="file"
            accept="image/*"
            disabled={!!pending}
            style={{
              width: "100%",
              fontSize: 13,
              color: "var(--text-2)",
            }}
          />
        </div>

        <div>
          <label className="label" style={{ display: "block", marginBottom: 8 }}>
            Cover image <span style={{ color: "var(--faint)" }}>optional</span>
          </label>
          <input
            name="cover"
            type="file"
            accept="image/*"
            disabled={!!pending}
            style={{
              width: "100%",
              fontSize: 13,
              color: "var(--text-2)",
            }}
          />
        </div>

        {saveState?.error && (
          <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{saveState.error}</p>
        )}

        <button type="submit" className="btn-primary" disabled={!!pending}>
          {pending ? "Saving…" : "Save & go to dashboard"}
        </button>
      </form>

      <form action={skipOnboardingAppearance}>
        <button
          type="submit"
          disabled={!!pending}
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--faint)",
            background: "none",
            border: "none",
            cursor: pending ? "not-allowed" : "pointer",
            padding: "12px 0",
          }}
        >
          Skip — use portfolio · initials as fallback
        </button>
      </form>
    </div>
  );
}
