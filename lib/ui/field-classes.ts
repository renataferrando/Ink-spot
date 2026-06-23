import { cn } from "@/lib/utils";

/** Design-system text field (matches profile edit form). */
export const fieldInputClass =
  "w-full rounded-(--r-md) bg-surface-2 border border-hairline px-4 py-3.5 text-[15px] text-(--text) outline-none transition-[border-color,box-shadow,opacity] duration-150 placeholder:text-faint focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

export const fieldInputSmClass =
  "w-full rounded-lg bg-surface-2 border border-hairline px-3 py-2.5 text-sm text-(--text) outline-none transition-[border-color,box-shadow,opacity] duration-150 placeholder:text-faint focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

export const fieldTextareaClass = cn(fieldInputClass, "resize-none leading-normal");

export const fieldLabelRowClass = "mb-2 flex items-center gap-1.5";

export const fieldRequiredMarkClass = "text-[10px] text-red-400";

export const fieldOptionalMarkClass = "text-faint font-mono text-[9px] tracking-[0.08em] uppercase";

export const fieldHintClass = "text-faint mt-1.5 text-[12px] leading-normal";

export const fieldErrorClass = "m-0 text-[13px] text-red-400";

export const formStackClass = "flex flex-col gap-5";

export const onboardingTitleClass =
  "m-0 font-sans text-[32px] leading-[1.05] font-medium tracking-[-0.02em] text-(--text)";

export const onboardingLeadClass = "text-dim m-0 text-[14px] leading-[1.55]";

export const accentWordClass = "text-ink-spot";

export const ghostTextButtonClass =
  "text-faint hover:text-dim cursor-pointer border-0 bg-transparent p-0 font-mono text-[10px] tracking-[0.1em] uppercase transition-colors disabled:cursor-not-allowed";

export const surfacePanelClass = "bg-surface border-hairline rounded-xl border p-[18px]";

export function uploadDropzoneClass(dragOver: boolean) {
  return cn(
    "flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-(--r-lg) border border-dashed bg-surface px-6 py-9 text-center transition-[border-color] duration-150",
    dragOver ? "border-ink-spot" : "border-hairline",
  );
}

export const fileInputClass = "w-full text-[13px] text-text-2";

export function copyCodeButtonClass(copied: boolean) {
  return cn(
    "text-dim flex cursor-pointer items-center gap-1 border-0 bg-transparent font-mono text-[10px] tracking-[0.14em] uppercase transition-colors",
    copied && "text-ink-spot",
  );
}
