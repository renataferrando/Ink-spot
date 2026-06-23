import { MapPin } from "lucide-react";

interface LocationBadgeProps {
  locationName?: string;
  distanceKm?: number;
}

export function LocationBadge({ locationName, distanceKm }: LocationBadgeProps) {
  if (!locationName && distanceKm == null) return null;

  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs">
      <MapPin className="size-3 shrink-0" aria-hidden />
      {distanceKm != null ? (
        <span>
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
          {locationName && ` · ${locationName}`}
        </span>
      ) : (
        <span>{locationName}</span>
      )}
    </span>
  );
}
