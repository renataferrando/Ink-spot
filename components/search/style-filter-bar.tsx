"use client";

// Not wired to Search yet. Intended: parent passes `onChange` → Search adds `styles` to
// `/api/artists` (BE filter). Avoid client-only filtering of the full artist list here.

import { cn } from "@/lib/utils";
import { ALL_STYLES, STYLE_LABELS, type ArtistStyle } from "@/types/artist";

interface StyleFilterBarProps {
  selected: ArtistStyle[];
  onChange: (styles: ArtistStyle[]) => void;
}

export function StyleFilterBar({ selected, onChange }: StyleFilterBarProps) {
  function toggle(style: ArtistStyle) {
    if (selected.includes(style)) {
      onChange(selected.filter((s) => s !== style));
    } else {
      onChange([...selected, style]);
    }
  }

  return (
    <div
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter by style"
    >
      {ALL_STYLES.map((style) => {
        const active = selected.includes(style);
        return (
          <button
            key={style}
            type="button"
            onClick={() => toggle(style)}
            aria-pressed={active}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {STYLE_LABELS[style]}
          </button>
        );
      })}
    </div>
  );
}
