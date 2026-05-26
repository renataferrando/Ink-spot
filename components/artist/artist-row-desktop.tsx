import Image from "next/image";
import Link from "next/link";

import { STYLE_LABELS, type ArtistLocation, type ArtistPublic } from "@/types/artist";

interface Props {
  artist: ArtistPublic;
  priority?: boolean;
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
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
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

/** Desktop explore list row. */
export function ArtistRowDesktop({ artist, priority = false }: Props) {
  const thumbs = artist.portfolio_items.slice(0, 3);
  const currentIn = artist.current_location?.location_name ?? "—";
  const next = pickNextLocation(artist.upcoming_locations);
  const nextLabel = next
    ? `${next.location_name.split(",")[0]}${formatNextDate(next.starts_at) ? ` · ${formatNextDate(next.starts_at)}` : ""}`
    : "—";

  const href = `/artist/${artist.handle}`;

  return (
    <article className="border-hairline grid grid-cols-[64px_minmax(0,1fr)_auto_auto] items-center gap-4 border-b py-4">
      <Link
        href={href}
        aria-label={`View ${artist.display_name}`}
        className="contents text-inherit"
      >
        <div className="size-16 shrink-0">
          {artist.profile_image_url ? (
            <Image
              className="size-16 rounded-full object-cover"
              src={artist.profile_image_url}
              alt=""
              width={64}
              height={64}
              priority={priority}
            />
          ) : (
            <span
              aria-hidden
              className="bg-surface-2 border-hairline text-text-2 flex size-16 items-center justify-center rounded-full border text-[18px] font-semibold tracking-[-0.02em]"
            >
              {initials(artist.display_name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-[17px] font-semibold tracking-[-0.02em] text-(--text)">
            {artist.display_name}
          </div>
          <div className="text-dim mt-0.5 text-[12px]">
            @{artist.handle} ·{" "}
            {artist.years_experience != null ? `${artist.years_experience} yrs` : "—"}
          </div>
          <div className="text-text-2 mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
            <span className="size-1.5 shrink-0 rounded-full bg-[#22c55e]" />
            <span className="text-faint font-mono text-[10px] tracking-widest uppercase">Now</span>
            {currentIn.split(",")[0]}
            <span className="text-faint mx-0.5">·</span>
            <span className="text-faint font-mono text-[10px] tracking-widest uppercase">
              Next:
            </span>{" "}
            {nextLabel}
          </div>
          {artist.primary_styles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {artist.primary_styles.slice(0, 3).map((s, i) => (
                <span key={s} className={"chip" + (i === 0 ? " active" : "")}>
                  {STYLE_LABELS[s]}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => {
            const item = thumbs[i];
            if (!item) {
              return (
                <div
                  key={`e-${i}`}
                  className="border-hairline size-14 shrink-0 rounded-[10px] border border-dashed opacity-45"
                />
              );
            }
            return (
              <div
                key={item.id}
                className="border-hairline bg-surface-2 size-14 shrink-0 overflow-hidden rounded-[10px] border"
              >
                <Image
                  src={item.image_url}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  priority={priority && i === 0}
                />
              </div>
            );
          })}
        </div>
      </Link>
      <Link
        href={href}
        className="border-ds-border text-text-2 hover:text-(--text) hover:border-ink-spot inline-flex h-9 items-center justify-center gap-1.5 self-center rounded-[10px] border px-3.5 font-mono text-[10px] tracking-[0.12em] uppercase no-underline transition-colors"
      >
        Open
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          width={14}
          height={14}
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </article>
  );
}
