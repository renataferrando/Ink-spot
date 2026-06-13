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

export type NextLocationResult = {
  location: ArtistLocation;
  starts_at: string | null;
};

type LocInput = ArtistLocation | Record<string, unknown>;

/**
 * Computes the chronologically next place the artist will be.
 *
 * When currently traveling with an end date, returning to home base is treated
 * as the next stop unless a future travel entry starts on or before that date.
 * When at home base, returns the earliest future guest_spot / traveling entry.
 */
export function computeNextLocation(
  locs: LocInput[],
  current?: LocInput | null,
): NextLocationResult | null {
  const today = startOfDay(new Date());
  const currentLoc = current
    ? (current as ArtistLocation)
    : computeCurrentLocation(locs as ArtistLocation[] | Record<string, unknown>[]);
  const homeBase = locs.find((l) => (l.kind as string) === "home_base") as ArtistLocation | undefined;

  const futureTravel = locs
    .filter((l) => {
      if ((l.kind as string) === "home_base") return false;
      const startsAt = l.starts_at as string | null | undefined;
      if (!startsAt) return false;
      return startOfDay(new Date(startsAt)) > today;
    })
    .sort(
      (a, b) =>
        startOfDay(new Date(a.starts_at as string)).getTime() -
        startOfDay(new Date(b.starts_at as string)).getTime(),
    ) as ArtistLocation[];

  const nextTravel = futureTravel[0] ?? null;

  const returnHome =
    currentLoc &&
    currentLoc.kind !== "home_base" &&
    currentLoc.ends_at &&
    homeBase
      ? {
          location: homeBase,
          starts_at: toDateString(addDays(startOfDay(new Date(currentLoc.ends_at)), 1)),
        }
      : null;

  if (returnHome) {
    if (!nextTravel) return returnHome;
    const returnDay = startOfDay(new Date(returnHome.starts_at!)).getTime();
    const travelDay = startOfDay(new Date(nextTravel.starts_at!)).getTime();
    if (returnDay < travelDay) return returnHome;
  }

  if (nextTravel) {
    return { location: nextTravel, starts_at: nextTravel.starts_at ?? null };
  }

  return returnHome;
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

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats OpenCage-style location strings as "City, Country".
 * e.g. "Santa Teresa, Puntarenas Province, Costa Rica" → "Santa Teresa, Costa Rica"
 */
export function formatCityCountry(locationName: string | null | undefined): string {
  if (!locationName) return "";
  const parts = locationName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

/** Splits OpenCage-style strings into city + country for stacked display. */
export function splitCityCountry(locationName: string | null | undefined): {
  city: string;
  country: string;
} {
  if (!locationName) return { city: "", country: "" };
  const parts = locationName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { city: "", country: "" };
  if (parts.length === 1) return { city: parts[0], country: "" };
  return { city: parts[0], country: parts[parts.length - 1] };
}

type PlaceComponents = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  country?: string;
};

/** Builds "City, Country" from OpenCage result components, with formatted-string fallback. */
export function cityCountryFromComponents(
  components: PlaceComponents,
  formatted: string,
): string {
  const city =
    components.city ??
    components.town ??
    components.village ??
    components.hamlet ??
    components.municipality;
  const country = components.country;
  if (city && country) return `${city}, ${country}`;
  return formatCityCountry(formatted) || formatted.trim();
}
