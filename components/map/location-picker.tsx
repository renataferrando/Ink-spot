"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, MapPin, Check } from "lucide-react";

import { MAP_STYLE_URL } from "@/lib/maplibre/config";
import { btnPrimarySm, btnSecondarySm } from "@/lib/ui/classes";

interface LocationPickerProps {
  /** Initial map center */
  center: { lat: number; lng: number };
  onConfirm: (location: { lat: number; lng: number; formatted: string }) => void;
  onCancel: () => void;
}

export function LocationPicker({ center, onConfirm, onCancel }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [center.lng, center.lat],
      zoom: 5,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (e) => {
      const { lat, lng } = e.lngLat;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new maplibregl.Marker({ color: "#1a1a1a" })
          .setLngLat([lng, lat])
          .addTo(map);
      }

      setPin({ lat, lng });
      setFormatted(null);
      setResolving(true);

      fetch(`/api/geocoding/reverse?lat=${lat}&lng=${lng}`)
        .then((r) => r.json())
        .then((d: { formatted: string | null }) => setFormatted(d.formatted))
        .catch(() => setFormatted(null))
        .finally(() => setResolving(false));
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm() {
    if (!pin) return;
    onConfirm({
      lat: pin.lat,
      lng: pin.lng,
      formatted: formatted ?? `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`,
    });
  }

  return (
    <div className="border-hairline overflow-hidden rounded-xl border">
      {/* Map */}
      <div className="relative h-56">
        <div ref={containerRef} className="h-full w-full" />
        {!pin && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="bg-surface/90 text-dim rounded-lg px-3 py-1.5 text-xs backdrop-blur-sm">
              Tap the map to place a pin
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-surface border-hairline flex items-center gap-2 border-t px-3 py-2.5">
        {pin ? (
          <>
            <div className="min-w-0 flex-1">
              {resolving ? (
                <span className="text-dim flex items-center gap-1.5 text-xs">
                  <Loader2 size={11} className="animate-spin" />
                  Resolving…
                </span>
              ) : (
                <span className="text-text-2 flex items-center gap-1.5 truncate text-xs">
                  <MapPin size={11} className="text-ink-spot shrink-0" />
                  {formatted ?? `${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}`}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-dim hover:text-(--text) font-mono text-[10px] tracking-[0.12em] uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={resolving}
              className={btnPrimarySm}
            >
              <Check size={12} aria-hidden />
              Use this location
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className={btnSecondarySm}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
