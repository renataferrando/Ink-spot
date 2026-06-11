"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { pageColumnClass, pageGutterClass } from "@/lib/ui/classes";

const TAGS: Record<string, string> = {
  "/explore": "NEARBY",
  "/search": "SEARCH",
  "/saved": "SAVED",
  "/account": "ACCOUNT",
};

export function TopBar({ isArtist = false }: { isArtist?: boolean }) {
  const pathname = usePathname();
  const tag = TAGS[pathname] ?? "";

  return (
    <header className="sticky top-0 z-5 bg-(--bg) pt-3.5 pb-2.5 lg:hidden">
      <div className={cn(pageColumnClass, pageGutterClass, "flex items-center justify-between")}>
        <div className="flex items-baseline font-sans text-[22px] font-medium tracking-[-0.01em] text-(--text)">
          InkSpot
          <span
            aria-hidden
            className="bg-ink-spot ml-1 inline-block size-1.5 shrink-0 -translate-y-2 rounded-full shadow-[0_0_12px_var(--accent-glow)]"
          />
        </div>

        {isArtist ? (
          <Link
            href="/dashboard"
            className="border-hairline flex items-center gap-2 rounded-full border px-[11px] py-1.5 transition-colors hover:bg-surface"
          >
            <span
              aria-hidden
              className="bg-ink-spot inline-block size-[5px] shrink-0 rounded-full shadow-[0_0_8px_var(--accent-glow)]"
            />
            <span className="text-text-2 font-mono text-[10px] tracking-[0.12em] uppercase">
              Artist dashboard
            </span>
          </Link>
        ) : (
          tag && (
            <span className="text-dim font-mono text-[10px] tracking-[0.14em] uppercase">{tag}</span>
          )
        )}
      </div>
    </header>
  );
}
