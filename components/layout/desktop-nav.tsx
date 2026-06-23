"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { pageColumnClass, pageGutterClass } from "@/lib/ui/classes";

const NAV = [
  {
    href: "/explore",
    label: "Explore",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        width={16}
        height={16}
        aria-hidden
      >
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Search",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        width={16}
        height={16}
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        width={16}
        height={16}
        aria-hidden
      >
        <path d="M12 20s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 22.5 7.5 21 11c-2 4.5-9 9-9 9z" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        width={16}
        height={16}
        aria-hidden
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
] as const;

/** Claude Design desktop top bar — wordmark, pill tabs, Explore search affordance, account. */
export function DesktopNav({
  showDashboard = false,
  isLoggedIn = false,
}: {
  showDashboard?: boolean;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header
      aria-label="Main"
      className="border-hairline sticky top-0 z-20 hidden shrink-0 border-b bg-(--bg) py-3 lg:block"
    >
      <div
        className={cn(pageColumnClass, pageGutterClass, "flex items-center justify-between gap-6")}
      >
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="inline-flex shrink-0 items-baseline font-sans text-[20px] font-medium tracking-[-0.02em] text-(--text)"
          >
            InkSpot
            <span
              aria-hidden
              className="bg-ink-spot ml-1 inline-block size-[5px] -translate-y-1.5 rounded-full shadow-[0_0_10px_var(--accent-glow)]"
            />
          </Link>
          <nav
            aria-label="Primary"
            className="border-hairline bg-surface-2 flex items-center gap-1 rounded-full border p-1"
          >
            {NAV.filter(({ href }) => href !== "/saved" || isLoggedIn).map(
              ({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "text-dim inline-flex items-center gap-2 rounded-full border border-transparent px-3.5 py-2 text-[13px] font-medium transition-colors hover:text-(--text) [&_svg]:shrink-0 [&_svg]:opacity-85",
                      active && "bg-surface border-hairline text-(--text)",
                    )}
                  >
                    {icon}
                    <span>{label}</span>
                  </Link>
                );
              },
            )}
          </nav>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3.5">
          {showDashboard && (
            <Link
              href="/dashboard"
              className={cn(
                "border-hairline flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors",
                pathname.startsWith("/dashboard")
                  ? "bg-surface-2 text-(--text)"
                  : "text-text-2 hover:bg-surface hover:text-(--text)",
              )}
            >
              <span
                aria-hidden
                className="bg-ink-spot inline-block size-[5px] rounded-full shadow-[0_0_8px_var(--accent-glow)]"
              />
              Switch to artist dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
