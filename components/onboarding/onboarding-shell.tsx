import Link from "next/link";

import { StepDots } from "./step-dots";

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface OnboardingShellProps {
  step: OnboardingStep;
  /** Defaults to 6 — full artist onboarding (profile → … → avatar). */
  totalSteps?: 6;
  backHref?: string;
  children: React.ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps = 6,
  backHref,
  children,
}: OnboardingShellProps) {
  const total = totalSteps;
  const label = String(total).padStart(2, "0");
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex items-center px-5"
        style={{
          height: 52,
          borderBottom: "1px solid var(--hairline)",
          flexShrink: 0,
        }}
      >
        <div className="w-8">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              style={{ color: "var(--text-2)", display: "flex", alignItems: "center" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                width={20}
                height={20}
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          ) : null}
        </div>

        <div className="label flex-1 text-center">
          Step {String(step).padStart(2, "0")} of {label}
        </div>

        <div className="w-8" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-sm flex-1 px-6 py-8">
          <StepDots current={step} totalSteps={total} />
          {children}
        </div>
      </div>
    </div>
  );
}
