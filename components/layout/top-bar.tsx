"use client";

import { usePathname } from "next/navigation";

const TAGS: Record<string, string> = {
  "/explore": "SANTA TERESA · 12 KM",
  "/search": "SEARCH",
  "/saved": "SAVED",
  "/account": "ACCOUNT",
};

export function TopBar() {
  const pathname = usePathname();
  const tag = TAGS[pathname] ?? "";

  return (
    <header className="sticky top-0 z-5 flex items-center justify-between bg-(--bg) px-[18px] pt-3.5 pb-2.5 lg:hidden">
      <div className="flex items-baseline font-sans text-[22px] font-medium tracking-[-0.01em] text-(--text)">
        InkSpot
        <span
          aria-hidden
          className="bg-ink-spot ml-1 inline-block size-1.5 shrink-0 -translate-y-2 rounded-full shadow-[0_0_12px_var(--accent-glow)]"
        />
      </div>

      {tag && (
        <span className="text-dim font-mono text-[10px] tracking-[0.14em] uppercase">{tag}</span>
      )}
    </header>
  );
}
