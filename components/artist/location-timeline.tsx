import { MapPin, CalendarDays } from "lucide-react";
import type { ArtistLocation } from "@/types/artist";

interface LocationTimelineProps {
  currentLocation?: ArtistLocation | null;
  upcomingLocations?: ArtistLocation[];
}

export function LocationTimeline({
  currentLocation,
  upcomingLocations = [],
}: LocationTimelineProps) {
  const upcoming = upcomingLocations.filter(
    (l) => l.starts_at && new Date(l.starts_at) > new Date(),
  );

  if (!currentLocation && upcoming.length === 0) return null;

  return (
    <section className="space-y-3">
      {currentLocation && (
        <div className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3">
          <MapPin className="text-primary size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-primary text-xs font-medium tracking-wide uppercase">Here now</p>
            <p className="truncate text-sm">{currentLocation.location_name}</p>
            {currentLocation.studio_name && (
              <p className="text-muted-foreground text-xs">{currentLocation.studio_name}</p>
            )}
          </div>
        </div>
      )}

      {upcoming.map((loc) => (
        <div
          key={loc.id}
          className="border-border bg-card flex items-center gap-3 rounded-xl border px-4 py-3"
        >
          <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{loc.location_name}</p>
            {loc.studio_name && <p className="text-muted-foreground text-xs">{loc.studio_name}</p>}
            {loc.starts_at && (
              <p className="text-muted-foreground text-xs">
                {new Date(loc.starts_at).toLocaleDateString()} —{" "}
                {loc.ends_at ? new Date(loc.ends_at).toLocaleDateString() : "open-ended"}
              </p>
            )}
          </div>
          <span className="border-border text-muted-foreground shrink-0 rounded-full border px-2 py-0.5 text-[10px] capitalize">
            {loc.kind.replace("_", " ")}
          </span>
        </div>
      ))}
    </section>
  );
}
