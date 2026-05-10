"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  {
    href:  "/explore",
    label: "Explore",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16} aria-hidden>
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>
      </svg>
    ),
  },
  {
    href:  "/search",
    label: "Search",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16} aria-hidden>
        <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
      </svg>
    ),
  },
  {
    href:  "/saved",
    label: "Saved",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16} aria-hidden>
        <path d="M12 20s-7-4.5-9-9c-1.5-3.5 1-7 4.5-7 2 0 3.5 1 4.5 2.5C13 5 14.5 4 16.5 4 20 4 22.5 7.5 21 11c-2 4.5-9 9-9 9z"/>
      </svg>
    ),
  },
  {
    href:  "/account",
    label: "Account",
    icon:  (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16} aria-hidden>
        <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
      </svg>
    ),
  },
] as const;

/** Claude Design desktop top bar — wordmark, pill tabs, Explore search affordance, account. */
export function DesktopNav() {
  const pathname = usePathname();
  const onExplore = pathname === "/explore" || pathname.startsWith("/explore/");

  return (
    <header className="dt-navbar hidden lg:flex" aria-label="Main">
      <div className="dt-nav-left">
        <Link href="/explore" className="dt-wordmark-h">
          InkSpot
          <span className="dot" />
        </Link>
        <nav className="dt-nav-tabs" aria-label="Primary">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={"dt-nav-tab" + (active ? " active" : "")}
                aria-current={active ? "page" : undefined}
              >
                {icon}
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="dt-nav-right">
        {onExplore && (
          <Link href="/search" className="dt-search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={16} height={16} aria-hidden>
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
            <span>Describe what you&apos;re imagining…</span>
          </Link>
        )}
        <Link href="/account" className="dt-account" aria-label="Account">
          <span className="dt-account-placeholder" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
