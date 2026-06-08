"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { DEFAULT_ZOOM, MAP_STYLE_URL, SANTA_TERESA_CENTER } from "@/lib/maplibre/config";
import { chipActiveClass, chipClass } from "@/lib/ui/classes";
import { STYLE_LABELS, type ArtistPublic } from "@/types/artist";

import { ArtistMapSheet } from "./artist-map-sheet";
import "./artists-map.css";

type MapArtist = Pick<
  ArtistPublic,
  "id" | "handle" | "display_name" | "profile_image_url" | "primary_styles" | "current_location"
>;

interface ArtistsMapProps {
  artists: MapArtist[];
  userLocation?: { lat: number; lng: number };
  hoveredArtistId?: string | null;
}

type MarkerEntry = { marker: maplibregl.Marker; el: HTMLButtonElement };

function buildTooltipContent(artist: MapArtist): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "map-marker-tooltip";

  const name = document.createElement("p");
  name.className = "map-marker-tooltip__name";
  name.textContent = artist.display_name;
  root.appendChild(name);

  const handle = document.createElement("p");
  handle.className = "map-marker-tooltip__handle";
  handle.textContent = `@${artist.handle}`;
  root.appendChild(handle);

  const locationName = artist.current_location?.location_name;
  if (locationName) {
    const location = document.createElement("div");
    location.className = "map-marker-tooltip__location";

    const now = document.createElement("span");
    now.className = "map-marker-tooltip__now";
    now.textContent = "● Now";
    location.appendChild(now);

    const place = document.createElement("span");
    place.textContent = locationName;
    location.appendChild(place);

    root.appendChild(location);
  }

  if (artist.primary_styles.length > 0) {
    const chips = document.createElement("div");
    chips.className = "map-marker-tooltip__chips";

    artist.primary_styles.slice(0, 3).forEach((style, index) => {
      const chip = document.createElement("span");
      chip.className = index === 0 ? chipActiveClass : chipClass;
      chip.textContent = STYLE_LABELS[style];
      chips.appendChild(chip);
    });

    root.appendChild(chips);
  }

  return root;
}

function createMarkerElement(artist: MapArtist, onSelect: () => void): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `View ${artist.display_name}`);
  el.className = "map-marker";

  const dot = document.createElement("span");
  dot.className = "map-marker__dot";
  dot.setAttribute("aria-hidden", "true");
  dot.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="white"/></svg>';
  el.appendChild(dot);

  el.addEventListener("click", onSelect);

  return el;
}

export function ArtistsMap({ artists, userLocation, hoveredArtistId }: ArtistsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipSyncRef = useRef<(() => void) | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<MapArtist | null>(null);

  const hideTooltip = () => {
    const map = mapRef.current;
    const sync = tooltipSyncRef.current;
    if (map && sync) {
      map.off("move", sync);
      map.off("zoom", sync);
    }
    tooltipSyncRef.current = null;
    tooltipRef.current?.remove();
    tooltipRef.current = null;
  };

  const clearMarkers = () => {
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
  };

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

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      hideTooltip();
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      clearMarkers();
      hideTooltip();

      artists
        .filter((a) => a.current_location != null)
        .forEach((artist) => {
          const loc = artist.current_location!;
          const lngLat: [number, number] = [loc.lng, loc.lat];

          const el = createMarkerElement(artist, () => {
            hideTooltip();
            setSelectedArtist(artist);
          });

          const showTooltip = () => {
            hideTooltip();
            const tooltip = buildTooltipContent(artist);
            map.getContainer().appendChild(tooltip);
            tooltipRef.current = tooltip;

            const sync = () => {
              const point = map.project(lngLat);
              tooltip.style.left = `${point.x}px`;
              tooltip.style.top = `${point.y}px`;
            };

            sync();
            tooltipSyncRef.current = sync;
            map.on("move", sync);
            map.on("zoom", sync);
          };

          el.addEventListener("mouseenter", showTooltip);
          el.addEventListener("focus", showTooltip);
          el.addEventListener("mouseleave", hideTooltip);
          el.addEventListener("blur", hideTooltip);

          const marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(lngLat)
            .addTo(map);

          markersRef.current.set(artist.id, { marker, el });
        });
    };

    if (map.loaded()) {
      syncMarkers();
    } else {
      map.once("load", syncMarkers);
    }

    return () => {
      map.off("load", syncMarkers);
      clearMarkers();
      hideTooltip();
    };
  }, [artists]);

  // Fly to user's device location once it becomes available.
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: DEFAULT_ZOOM,
      duration: 1500,
    });
  }, [userLocation]);

  // Highlight the marker whose artist is hovered in the list.
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("map-marker--hovered", id === hoveredArtistId);
    });
  }, [hoveredArtistId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <ArtistMapSheet artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
}
