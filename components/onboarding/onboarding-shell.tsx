import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { StepDots } from "./step-dots";
import { cn } from "@/lib/utils";
import { labelClass, pageColumnClass, pageGutterClass } from "@/lib/ui/classes";

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
    <div className="flex min-h-screen flex-col bg-(--bg) text-(--text)">
      <div className={cn(pageColumnClass, pageGutterClass, "border-hairline flex h-[52px] shrink-0 items-center border-b")}>
        <div className="w-8">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="text-text-2 flex items-center transition-colors hover:text-(--text)"
            >
              <ChevronLeft size={20} aria-hidden />
            </Link>
          ) : null}
        </div>

        <div className={cn(labelClass, "flex-1 text-center")}>
          Step {String(step).padStart(2, "0")} of {label}
        </div>

        <div className="w-8" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className={cn(pageColumnClass, pageGutterClass, "flex-1 py-8")}>
          <StepDots current={step} totalSteps={total} />
          {children}
        </div>
      </div>
    </div>
  );
}
