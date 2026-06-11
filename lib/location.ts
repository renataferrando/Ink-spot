import type { ArtistLocation } from "@/types/artist";

/**
 * Computes which location is "Here now" based on today's date.
 *
 * Priority:
 *   1. A guest_spot or traveling whose date range contains today.
 *   2. The home_base (permanent fallback, no date required).
 *
 * Does NOT rely on the is_current DB flag, which can be stale between cron runs.
 */
export function computeCurrentLocation(
  locs: ArtistLocation[] | Record<string, unknown>[],
): ArtistLocation | null {
  const today = startOfDay(new Date());

  const activeTravel = locs.find((l) => {
    const kind = l.kind as string;
    if (kind === "home_base") return false;
    const startsAt = l.starts_at as string | null | undefined;
    if (!startsAt) return false;
    const endsAt = l.ends_at as string | null | undefined;
    return (
      startOfDay(new Date(startsAt)) <= today &&
      (!endsAt || startOfDay(new Date(endsAt)) >= today)
    );
  });

  if (activeTravel) return activeTravel as ArtistLocation;

  const homeBase = locs.find((l) => (l.kind as string) === "home_base");
  return (homeBase as ArtistLocation) ?? null;
}

/**
 * Returns true if two date ranges overlap (inclusive on both ends).
 * An open-ended range (no end date) is treated as extending to infinity.
 */
export function dateRangesOverlap(
  aStart: string,
  aEnd: string | null | undefined,
  bStart: string,
  bEnd: string | null | undefined,
): boolean {
  const aS = startOfDay(new Date(aStart)).getTime();
  const aE = aEnd ? startOfDay(new Date(aEnd)).getTime() : Infinity;
  const bS = startOfDay(new Date(bStart)).getTime();
  const bE = bEnd ? startOfDay(new Date(bEnd)).getTime() : Infinity;
  return aS <= bE && bS <= aE;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
