"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ArtistCardSkeleton } from "@/components/artist/artist-card-skeleton";
import type { ArtistPublic } from "@/types/artist";

const ArtistsMap = dynamic(() => import("./artists-map").then((m) => m.ArtistsMap), {
  ssr: false,
  loading: () => (
    <div className="bg-muted flex h-full items-center justify-center">
      <div className="grid grid-cols-2 gap-3 p-4 opacity-40">
        {Array.from({ length: 4 }, (_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </div>
  ),
});

type MapArtist = Pick<
  ArtistPublic,
  "id" | "handle" | "display_name" | "current_location" | "profile_image_url" | "primary_styles"
>;

interface MapContainerProps {
  artists: MapArtist[];
  hoveredArtistId?: string | null;
}

export function MapContainer({ artists, hoveredArtistId }: MapContainerProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* permission denied or unavailable — keep Santa Teresa default */ },
      { timeout: 8000 },
    );
  }, []);

  return <ArtistsMap artists={artists} userLocation={userLocation} hoveredArtistId={hoveredArtistId} />;
}
