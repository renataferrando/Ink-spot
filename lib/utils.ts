import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional Tailwind class names with clsx and resolve conflicts via
 * tailwind-merge. Use this everywhere instead of manual string concatenation.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a distance in meters as a localized human-readable string. Metric
 * units — under 1 km in meters; longer distances in kilometres with sensible
 * precision.
 */
export function formatDistance(
  meters: number,
  locale: string = "en-US",
): string {
  if (!Number.isFinite(meters) || meters < 0) {
    throw new Error(`formatDistance: invalid distance ${meters}`);
  }

  if (meters < 1000) {
    const rounded = Math.round(meters);
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "meter",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    }).format(rounded);
  }

  const km = meters / 1000;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "short",
    maximumFractionDigits: km < 10 ? 1 : 0,
  }).format(km);
}

/**
 * Produce a URL-safe slug from arbitrary text. Diacritics are stripped via
 * Unicode NFD normalization, non-alphanumeric characters become hyphens, and
 * leading/trailing hyphens are trimmed. Returns an empty string for empty
 * input.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
