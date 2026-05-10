import "./artist-card.css";

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
        new Date(a.starts_at as string).getTime() -
        new Date(b.starts_at as string).getTime(),
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
      className={cn("card", className)}
    >
      <div className="row">
        <div className="avatar">
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
            <span className="initials">{initials(artist.display_name)}</span>
          )}
        </div>

        <div className="body">
          <div className="name-row">
            <h3 className="name">{artist.display_name}</h3>
          </div>
          <div className="handle">@{artist.handle}</div>

          {(currentIn || nextLabel || distanceKm != null) && (
            <div className="meta">
              {currentIn && (
                <>
                  <span className="now">● Now</span>
                  <span>{currentIn}</span>
                </>
              )}
              {nextLabel && (
                <>
                  <span className="dot">·</span>
                  <span className="next">Next: {nextLabel}</span>
                </>
              )}
              {distanceKm != null && (
                <>
                  <span className="dot">·</span>
                  <span className="next">
                    {distanceKm < 1
                      ? `${Math.round(distanceKm * 1000)} m`
                      : `${distanceKm.toFixed(1)} km`}
                  </span>
                </>
              )}
            </div>
          )}

          {artist.primary_styles.length > 0 && (
            <div className="badges">
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
        <div className="match">
          <div className="pct">{Math.round(matchScore * 100)}%</div>
          <div className="lbl">match</div>
        </div>
      )}

      <div className="thumbs">
        {[0, 1, 2].map((i) => {
          const item = thumbs[i];
          if (!item) {
            return <div key={`empty-${i}`} className="thumb-empty" aria-hidden />;
          }
          return (
            <div key={item.id} className="thumb">
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
