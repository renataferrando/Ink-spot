interface IgPreviewCardProps {
  handle: string;
  verified?: boolean;
}

export function IgPreviewCard({ handle, verified = false }: IgPreviewCardProps) {
  return (
    <div className="bg-surface border-hairline flex items-center gap-3 rounded-xl border px-4 py-3.5">
      <div className="bg-surface-3 border-hairline text-text-2 flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-[13px]">
        @
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-sm text-(--text)">{handle}</div>
        <div className="text-dim mt-0.5 text-[11px]">Public Instagram profile</div>
      </div>

      {verified && (
        <span className="text-ink-spot shrink-0 font-mono text-[10px] tracking-[0.12em] uppercase">
          Verified
        </span>
      )}
    </div>
  );
}
