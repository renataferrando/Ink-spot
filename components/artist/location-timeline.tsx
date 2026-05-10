import { MapPin, CalendarDays } from "lucide-react";
import type { ArtistLocation } from "@/types/artist";

interface LocationTimelineProps {
  currentLocation?: ArtistLocation | null;
  upcomingLocations?: ArtistLocation[];
}

export function LocationTimeline({ currentLocation, upcomingLocations = [] }: LocationTimelineProps) {
  const upcoming = upcomingLocations.filter(
    (l) => l.starts_at && new Date(l.starts_at) > new Date(),
  );

  if (!currentLocation && upcoming.length === 0) return null;

  return (
    <section className="space-y-3">
      {currentLocation && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary uppercase tracking-wide">Here now</p>
            <p className="truncate text-sm">{currentLocation.location_name}</p>
            {currentLocation.studio_name && (
              <p className="text-xs text-muted-foreground">{currentLocation.studio_name}</p>
            )}
          </div>
        </div>
      )}

      {upcoming.map((loc) => (
        <div key={loc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{loc.location_name}</p>
            {loc.studio_name && (
              <p className="text-xs text-muted-foreground">{loc.studio_name}</p>
            )}
            {loc.starts_at && (
              <p className="text-xs text-muted-foreground">
                {new Date(loc.starts_at).toLocaleDateString()} —{" "}
                {loc.ends_at ? new Date(loc.ends_at).toLocaleDateString() : "open-ended"}
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
            {loc.kind.replace("_", " ")}
          </span>
        </div>
      ))}
    </section>
  );
}
