import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { STYLE_LABELS, type ArtistLocation, type ArtistPublic } from "@/types/artist";

interface ArtistCardProps {
  artist: ArtistPublic;
  matchScore?: number;
  distanceKm?: number;
  priority?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatNextDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pickNextLocation(upcoming?: ArtistLocation[]) {
  if (!upcoming || upcoming.length === 0) return null;
  const future = upcoming
    .filter((l) => l.starts_at)
    .sort(
      (a, b) =>
        new Date(a.starts_at as string).getTime() - new Date(b.starts_at as string).getTime(),
    );
  return future[0] ?? upcoming[0];
}

export function ArtistCard({
  artist,
  matchScore,
  distanceKm,
  priority = false,
  className,
}: ArtistCardProps) {
  const thumbs = artist.portfolio_items.slice(0, 3);
  const currentIn = artist.current_location?.location_name ?? null;
  const next = pickNextLocation(artist.upcoming_locations);
  const nextLabel = next
    ? `${next.location_name}${formatNextDate(next.starts_at) ? ` ${formatNextDate(next.starts_at)}` : ""}`
    : null;

  return (
    <Link
      href={`/artist/${artist.handle}`}
      aria-label={`View ${artist.display_name}`}
      className={cn(
        "bg-surface border-hairline hover:bg-surface-2 active:bg-surface-2 relative block border-b p-[18px] text-inherit no-underline transition-colors",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        <div className="border-hairline bg-surface-3 relative size-16 shrink-0 overflow-hidden rounded-full border">
          {artist.profile_image_url ? (
            <Image
              src={artist.profile_image_url}
              alt={artist.display_name}
              fill
              sizes="64px"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <span className="text-text-2 absolute inset-0 flex items-center justify-center font-mono text-[14px] tracking-[0.04em]">
              {initials(artist.display_name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="mt-0.5 mb-1 text-[22px] leading-[1.1] font-medium tracking-[-0.01em] text-(--text)">
              {artist.display_name}
            </h3>
          </div>
          <div className="text-dim font-mono text-[11px]">@{artist.handle}</div>

          {(currentIn || nextLabel || distanceKm != null) && (
            <div className="text-text-2 mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
              {currentIn && (
                <>
                  <span className="text-ink-spot font-mono text-[11px]">● Now</span>
                  <span>{currentIn}</span>
                </>
              )}
              {nextLabel && (
                <>
                  <span className="text-faint">·</span>
                  <span className="text-dim font-mono text-[11px]">Next: {nextLabel}</span>
                </>
              )}
              {distanceKm != null && (
                <>
                  <span className="text-faint">·</span>
                  <span className="text-dim font-mono text-[11px]">
                    {distanceKm < 1
                      ? `${Math.round(distanceKm * 1000)} m`
                      : `${distanceKm.toFixed(1)} km`}
                  </span>
                </>
              )}
            </div>
          )}

          {artist.primary_styles.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {artist.primary_styles.slice(0, 3).map((s, i) => (
                <span key={s} className={`chip${i === 0 ? " active" : ""}`}>
                  {STYLE_LABELS[s]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {matchScore != null && (
        <div className="absolute top-[18px] right-[18px] flex flex-col items-end gap-0.5">
          <div className="text-ink-spot font-mono text-[13px] font-medium">
            {Math.round(matchScore * 100)}%
          </div>
          <div className="text-faint font-mono text-[9px] tracking-[0.14em] uppercase">match</div>
        </div>
      )}

      <div className="mt-3.5 grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => {
          const item = thumbs[i];
          if (!item) {
            return (
              <div
                key={`empty-${i}`}
                aria-hidden
                className="border-hairline bg-surface-2 aspect-square rounded-[4px] border border-dashed"
              />
            );
          }
          return (
            <div
              key={item.id}
              className="bg-surface-2 relative aspect-square overflow-hidden rounded-[4px]"
            >
              <Image
                src={item.image_url}
                alt={item.alt_text ?? `${artist.display_name} portfolio`}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                className="object-cover"
                priority={priority && i === 0}
              />
            </div>
          );
        })}
      </div>
    </Link>
  );
}
