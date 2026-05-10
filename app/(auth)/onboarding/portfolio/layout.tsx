import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingShell step={5} backHref="/onboarding/location">{children}</OnboardingShell>;
}
