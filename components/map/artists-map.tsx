"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEFAULT_ZOOM,
  MAP_STYLE_URL,
  SANTA_TERESA_CENTER,
} from "@/lib/maplibre/config";
import type { ArtistPublic } from "@/types/artist";

import { ArtistMapSheet } from "./artist-map-sheet";

type MapArtist = Pick<
  ArtistPublic,
  "id" | "handle" | "display_name" | "profile_image_url" | "primary_styles" | "current_location"
>;

interface ArtistsMapProps {
  artists: MapArtist[];
  userLocation?: { lat: number; lng: number };
}

export function ArtistsMap({ artists, userLocation }: ArtistsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<MapArtist | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userLocation
      ? ([userLocation.lng, userLocation.lat] as [number, number])
      : ([SANTA_TERESA_CENTER.lng, SANTA_TERESA_CENTER.lat] as [number, number]);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    artists
      .filter((a) => a.current_location != null)
      .forEach((artist) => {
        const loc = artist.current_location!;
        const el = document.createElement("button");
        el.setAttribute("aria-label", `Ver ${artist.display_name}`);
        el.className =
          "size-8 rounded-full border-2 border-white bg-zinc-900 shadow-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
        el.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" class="size-4 mx-auto mt-1"><circle cx="12" cy="12" r="5" fill="white"/></svg>';

        el.addEventListener("click", () => setSelectedArtist(artist));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
  }, [artists]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <ArtistMapSheet
        artist={selectedArtist}
        onClose={() => setSelectedArtist(null)}
      />
    </div>
  );
}
