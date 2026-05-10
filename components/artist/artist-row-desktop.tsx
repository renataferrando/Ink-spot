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

/** Desktop explore list row — Claude Design `dt-list-row`. */
export function ArtistRowDesktop({ artist, priority = false }: Props) {
  const thumbs = artist.portfolio_items.slice(0, 3);
  const currentIn = artist.current_location?.location_name ?? "—";
  const next = pickNextLocation(artist.upcoming_locations);
  const nextLabel = next
    ? `${next.location_name.split(",")[0]}${formatNextDate(next.starts_at) ? ` · ${formatNextDate(next.starts_at)}` : ""}`
    : "—";

  const href = `/artist/${artist.handle}`;

  return (
    <article className="dt-list-row">
      <Link href={href} className="dt-list-primary" aria-label={`View ${artist.display_name}`}>
        <div className="dt-list-avatar-wrap">
          {artist.profile_image_url ? (
            <Image
              className="dt-list-avatar"
              src={artist.profile_image_url}
              alt=""
              width={64}
              height={64}
              priority={priority}
            />
          ) : (
            <span className="dt-list-avatar dt-list-avatar-initials" aria-hidden>
              {initials(artist.display_name)}
            </span>
          )}
        </div>
        <div className="dt-list-body">
          <div className="dt-list-name">{artist.display_name}</div>
          <div className="dt-list-handle">
            @{artist.handle} ·{" "}
            {artist.years_experience != null ? `${artist.years_experience} yrs` : "—"}
          </div>
          <div className="dt-list-loc">
            <span className="dot" />
            <span className="now-lbl">Now</span> {currentIn.split(",")[0]}
            <span className="sep">·</span>
            <span className="next-lbl">Next:</span> {nextLabel}
          </div>
          {artist.primary_styles.length > 0 && (
            <div className="badges" style={{ marginTop: 8 }}>
              {artist.primary_styles.slice(0, 3).map((s, i) => (
                <span key={s} className={"chip" + (i === 0 ? " active" : "")}>
                  {STYLE_LABELS[s]}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="dt-list-thumbs">
          {[0, 1, 2].map((i) => {
            const item = thumbs[i];
            if (!item) return <div key={`e-${i}`} className="dt-thumb-empty" />;
            return (
              <div key={item.id} className="dt-thumb">
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
      <Link href={href} className="dt-list-open">
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
