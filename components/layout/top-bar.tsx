"use client";

import { usePathname } from "next/navigation";

const TAGS: Record<string, string> = {
  "/explore": "SANTA TERESA · 12 KM",
  "/search":  "SEARCH",
  "/saved":   "SAVED",
  "/account": "ACCOUNT",
};

export function TopBar() {
  const pathname = usePathname();
  const tag = TAGS[pathname] ?? "";

  return (
    <header className="sticky top-0 z-[5] flex items-center justify-between bg-[var(--bg)] px-[18px] pb-[10px] pt-[14px] lg:hidden">
      {/* Wordmark */}
      <div
        style={{
          fontFamily: "var(--font-geist-sans, ui-sans-serif)",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--text)",
          display: "flex",
          alignItems: "baseline",
          gap: 0,
        }}
      >
        InkSpot
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent-glow)",
            marginLeft: 4,
            transform: "translateY(-8px)",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Tag */}
      {tag && (
        <span
          style={{
            fontFamily: "var(--font-jetbrains, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--dim)",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </span>
      )}
    </header>
  );
}
