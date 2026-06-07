import { cn } from "@/lib/utils";

// ── Buttons ──────────────────────────────────────────────────────────────────

export const btnPrimaryClass =
  "h-12 w-full lg:w-auto lg:px-12 bg-ink-spot text-(--accent-ink) rounded-full font-mono text-[12px] tracking-[0.12em] uppercase font-medium flex items-center justify-center gap-1.5 border-none cursor-pointer transition-opacity duration-150 disabled:opacity-55 disabled:cursor-not-allowed hover:opacity-90 no-underline";

export const btnSecondaryClass =
  "h-12 bg-surface-2 text-(--text) lg:px-12 lg:w-auto  border border-ds-border rounded-full font-mono text-[12px] tracking-[0.12em] uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-[background] duration-150 no-underline";

// ── Chip ─────────────────────────────────────────────────────────────────────

export const chipClass =
  "inline-flex items-center h-6 px-[11px] rounded-full font-mono text-[10px] tracking-[0.08em] uppercase text-text-2 border border-hairline bg-surface-2 whitespace-nowrap shrink-0";

export const chipActiveClass =
  "inline-flex items-center h-6 px-[11px] rounded-full font-mono text-[10px] tracking-[0.08em] uppercase text-(--accent-ink) border border-ink-spot bg-ink-spot whitespace-nowrap shrink-0";

// ── Labels ───────────────────────────────────────────────────────────────────

export const labelClass = "font-mono uppercase text-[10px] tracking-[0.14em] text-dim";

// ── Section head ─────────────────────────────────────────────────────────────

export const sectionHeadClass = "flex items-baseline justify-between pt-[22px] pb-[10px]";

export const sectionTitleClass =
  "text-[26px] font-medium leading-none tracking-[-0.02em] text-(--text) m-0";

export const sectionCountClass = "font-mono text-[10px] tracking-[0.14em] uppercase text-dim";

// ── Step bar indicator ────────────────────────────────────────────────────────

export const stepRailClass = "flex gap-1 mb-6";

export function stepBarClass(state: "done" | "now" | "empty"): string {
  const base = "flex-1 h-0.5 rounded-[1px]";
  if (state === "done") return cn(base, "bg-ink-spot");
  if (state === "now") return cn(base, "bg-(--text)");
  return cn(base, "bg-surface-3");
}

// ── Code box (verify form) ────────────────────────────────────────────────────

export const codeBoxClass =
  "flex items-center justify-between bg-surface border border-dashed border-ink-spot px-[18px] py-4 rounded-xl my-[18px]";

export const codeTextClass = "font-mono text-[18px] tracking-[0.18em] text-ink-spot";

// ── Badges ───────────────────────────────────────────────────────────────────

export const badgeAiClass =
  "inline-flex items-center gap-[3px] text-[10px] font-medium tracking-[0.04em] text-ink-spot bg-accent-soft border border-[rgba(100,103,242,0.25)] rounded-full px-1.5 py-[1px] leading-4 font-mono";

export const badgeMatchClass =
  "inline-flex items-center text-[11px] font-medium text-match bg-[rgba(56,189,248,0.08)] rounded-full px-2 py-[2px] leading-4 font-mono";

export const demoBannerClass =
  "bg-[rgba(251,191,36,0.06)] border-b border-[rgba(251,191,36,0.15)] text-demo";

// ── Filter bar ───────────────────────────────────────────────────────────────

export const filterBarClass =
  "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// ── Scrollbar ─────────────────────────────────────────────────────────────────

export const scrollbarNoneClass =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

// ── Page layout ──────────────────────────────────────────────────────────────

export const pageColumnClass = "w-full max-w-[var(--page-max)] mx-auto";
export const pageGutterClass = "px-[var(--page-gutter)]";

export const tabShellClass =
  "w-full max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] pt-3 pb-24 lg:mt-4 lg:mb-6 lg:min-h-[min(600px,82vh)] lg:border lg:border-hairline lg:rounded-[18px] lg:bg-(--bg) lg:overflow-x-hidden lg:pt-8 lg:pb-8";
