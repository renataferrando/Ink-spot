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
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px 10px",
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: "var(--bg)",
      }}
    >
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
