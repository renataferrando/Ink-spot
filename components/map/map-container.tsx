"use client";

import dynamic from "next/dynamic";

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
  userLocation?: { lat: number; lng: number };
}

export function MapContainer(props: MapContainerProps) {
  return <ArtistsMap {...props} />;
}
