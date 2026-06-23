"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { btnPrimaryClass, btnSecondaryClass } from "@/lib/ui/classes";

interface InstagramConnectButtonProps {
  /** Relative path to return to after a successful connection. */
  next: string;
  label?: string;
  /** Subtle secondary styling for the dashboard "Reconnect" affordance. */
  variant?: "primary" | "secondary";
}

/**
 * Anchor styled as a button that kicks off the Instagram Business OAuth dance.
 * It's an `<a>` (not a form) so the round-trip is a normal browser navigation
 * — Meta drops back onto our callback route, not a Server Action context.
 */
export function InstagramConnectButton({
  next,
  label = "Connect Instagram",
  variant = "primary",
}: InstagramConnectButtonProps) {
  const [pending, setPending] = useState(false);
  const href = `/api/auth/instagram/start?next=${encodeURIComponent(next)}`;
  return (
    <a
      href={href}
      onClick={() => setPending(true)}
      aria-disabled={pending}
      className={cn(
        variant === "primary"
          ? cn(
              btnPrimaryClass,
              "inline-flex w-full items-center justify-center gap-2 lg:w-auto lg:px-12",
            )
          : cn(btnSecondaryClass, "inline-flex items-center justify-center gap-2"),
        pending && "pointer-events-none opacity-70",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        width={16}
        height={16}
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
      <span>{pending ? "Connecting…" : label}</span>
    </a>
  );
}
