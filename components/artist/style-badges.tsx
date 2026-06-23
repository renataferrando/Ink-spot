import { cn } from "@/lib/utils";
import { STYLE_LABELS, type ArtistStyle } from "@/types/artist";

interface StyleBadgesProps {
  styles: ArtistStyle[];
  max?: number;
  className?: string;
}

export function StyleBadges({ styles, max = 3, className }: StyleBadgesProps) {
  const visible = styles.slice(0, max);
  const overflow = styles.length - max;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visible.map((s) => (
        <span
          key={s}
          className="border-border bg-secondary text-muted-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
        >
          {STYLE_LABELS[s]}
        </span>
      ))}
      {overflow > 0 && (
        <span className="border-border text-muted-foreground/60 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">
          +{overflow}
        </span>
      )}
    </div>
  );
}
