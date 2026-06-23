import { onboardingLeadClass, onboardingTitleClass } from "@/lib/ui/field-classes";

interface OnboardingHeadingProps {
  title: React.ReactNode;
  lead?: React.ReactNode;
}

export function OnboardingHeading({ title, lead }: OnboardingHeadingProps) {
  return (
    <div className="space-y-2">
      <h1 className={onboardingTitleClass}>{title}</h1>
      {lead ? <p className={onboardingLeadClass}>{lead}</p> : null}
    </div>
  );
}
