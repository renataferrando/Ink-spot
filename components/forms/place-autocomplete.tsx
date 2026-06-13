"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2, ChevronDown, Map } from "lucide-react";
import { fieldInputClass } from "@/lib/ui/field-classes";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false },
);

interface Country {
  code: string;
  name: string;
  /** Approximate center for the map picker initial view */
  lat: number;
  lng: number;
}

const WORLD_CENTER = { lat: 20, lng: 0 };
const WORLD_ZOOM = 2;
const COUNTRY_ZOOM = 5;

const COUNTRIES: Country[] = [
  { code: "af", name: "Afghanistan", lat: 33.9, lng: 67.7 },
  { code: "al", name: "Albania", lat: 41.1, lng: 20.2 },
  { code: "dz", name: "Algeria", lat: 28.0, lng: 1.7 },
  { code: "ar", name: "Argentina", lat: -38.4, lng: -63.6 },
  { code: "au", name: "Australia", lat: -25.3, lng: 133.8 },
  { code: "at", name: "Austria", lat: 47.5, lng: 14.5 },
  { code: "be", name: "Belgium", lat: 50.5, lng: 4.5 },
  { code: "bo", name: "Bolivia", lat: -16.3, lng: -63.6 },
  { code: "br", name: "Brazil", lat: -14.2, lng: -51.9 },
  { code: "ca", name: "Canada", lat: 56.1, lng: -106.3 },
  { code: "cl", name: "Chile", lat: -35.7, lng: -71.5 },
  { code: "cn", name: "China", lat: 35.9, lng: 104.2 },
  { code: "co", name: "Colombia", lat: 4.6, lng: -74.1 },
  { code: "cr", name: "Costa Rica", lat: 9.7, lng: -83.8 },
  { code: "hr", name: "Croatia", lat: 45.1, lng: 15.2 },
  { code: "cz", name: "Czech Republic", lat: 49.8, lng: 15.5 },
  { code: "dk", name: "Denmark", lat: 56.3, lng: 9.5 },
  { code: "do", name: "Dominican Republic", lat: 18.7, lng: -70.2 },
  { code: "ec", name: "Ecuador", lat: -1.8, lng: -78.2 },
  { code: "eg", name: "Egypt", lat: 26.8, lng: 30.8 },
  { code: "sv", name: "El Salvador", lat: 13.8, lng: -88.9 },
  { code: "fi", name: "Finland", lat: 61.9, lng: 25.7 },
  { code: "fr", name: "France", lat: 46.2, lng: 2.2 },
  { code: "de", name: "Germany", lat: 51.2, lng: 10.5 },
  { code: "gh", name: "Ghana", lat: 7.9, lng: -1.0 },
  { code: "gr", name: "Greece", lat: 39.1, lng: 21.8 },
  { code: "gt", name: "Guatemala", lat: 15.8, lng: -90.2 },
  { code: "hn", name: "Honduras", lat: 15.2, lng: -86.2 },
  { code: "hk", name: "Hong Kong", lat: 22.4, lng: 114.1 },
  { code: "hu", name: "Hungary", lat: 47.2, lng: 19.5 },
  { code: "in", name: "India", lat: 20.6, lng: 79.1 },
  { code: "id", name: "Indonesia", lat: -0.8, lng: 113.9 },
  { code: "ie", name: "Ireland", lat: 53.4, lng: -8.2 },
  { code: "il", name: "Israel", lat: 31.0, lng: 34.9 },
  { code: "it", name: "Italy", lat: 41.9, lng: 12.6 },
  { code: "jm", name: "Jamaica", lat: 18.1, lng: -77.3 },
  { code: "jp", name: "Japan", lat: 36.2, lng: 138.3 },
  { code: "ke", name: "Kenya", lat: 0.0, lng: 37.9 },
  { code: "mx", name: "Mexico", lat: 23.6, lng: -102.5 },
  { code: "ma", name: "Morocco", lat: 31.8, lng: -7.1 },
  { code: "nl", name: "Netherlands", lat: 52.1, lng: 5.3 },
  { code: "nz", name: "New Zealand", lat: -40.9, lng: 174.9 },
  { code: "ni", name: "Nicaragua", lat: 12.9, lng: -85.2 },
  { code: "ng", name: "Nigeria", lat: 9.1, lng: 8.7 },
  { code: "no", name: "Norway", lat: 60.5, lng: 8.5 },
  { code: "pa", name: "Panama", lat: 8.5, lng: -80.8 },
  { code: "py", name: "Paraguay", lat: -23.4, lng: -58.4 },
  { code: "pe", name: "Peru", lat: -9.2, lng: -75.0 },
  { code: "ph", name: "Philippines", lat: 12.9, lng: 121.8 },
  { code: "pl", name: "Poland", lat: 51.9, lng: 19.1 },
  { code: "pt", name: "Portugal", lat: 39.4, lng: -8.2 },
  { code: "pr", name: "Puerto Rico", lat: 18.2, lng: -66.6 },
  { code: "ro", name: "Romania", lat: 45.9, lng: 24.9 },
  { code: "ru", name: "Russia", lat: 61.5, lng: 105.3 },
  { code: "sa", name: "Saudi Arabia", lat: 23.9, lng: 45.1 },
  { code: "za", name: "South Africa", lat: -30.6, lng: 22.9 },
  { code: "kr", name: "South Korea", lat: 36.0, lng: 127.8 },
  { code: "es", name: "Spain", lat: 40.5, lng: -3.7 },
  { code: "se", name: "Sweden", lat: 60.1, lng: 18.6 },
  { code: "ch", name: "Switzerland", lat: 46.8, lng: 8.2 },
  { code: "tw", name: "Taiwan", lat: 23.7, lng: 121.0 },
  { code: "th", name: "Thailand", lat: 15.9, lng: 100.9 },
  { code: "tr", name: "Turkey", lat: 38.9, lng: 35.2 },
  { code: "ua", name: "Ukraine", lat: 48.4, lng: 31.2 },
  { code: "gb", name: "United Kingdom", lat: 55.4, lng: -3.4 },
  { code: "us", name: "United States", lat: 37.1, lng: -95.7 },
  { code: "uy", name: "Uruguay", lat: -32.5, lng: -55.8 },
  { code: "ve", name: "Venezuela", lat: 6.4, lng: -66.6 },
  { code: "vn", name: "Vietnam", lat: 14.1, lng: 108.3 },
];

interface Candidate {
  id: string;
  formatted: string;
  lat: number;
  lng: number;
}

interface PlaceAutocompleteProps {
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onSelect?: (candidate: Candidate) => void;
}

export function PlaceAutocomplete({
  name = "address",
  placeholder = "City or address",
  required,
  disabled,
  onSelect,
}: PlaceAutocompleteProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState(WORLD_CENTER);
  const [mapZoom, setMapZoom] = useState(WORLD_ZOOM);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchCandidates = useCallback(async (q: string, countryCode?: string) => {
    if (q.length < 2) {
      setCandidates([]);
      setOpen(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      if (countryCode) params.set("countrycode", countryCode);
      const res = await fetch(`/api/geocoding/autocomplete?${params.toString()}`);
      const data = (await res.json()) as { candidates: Candidate[] };
      setCandidates(data.candidates ?? []);
      setOpen(data.candidates.length > 0);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function openMap() {
    if (country) {
      setMapCenter({ lat: country.lat, lng: country.lng });
      setMapZoom(COUNTRY_ZOOM);
    } else {
      setMapCenter(WORLD_CENTER);
      setMapZoom(WORLD_ZOOM);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setMapZoom(COUNTRY_ZOOM);
          },
          () => {},
          { timeout: 5000, maximumAge: 60_000 },
        );
      }
    }
    setShowMap(true);
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    const found = COUNTRIES.find((c) => c.code === code) ?? null;
    setCountry(found);
    setSelected(null);
    setQuery("");
    setCandidates([]);
    setSearched(false);
    setShowMap(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setSelected(null);
    setSearched(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchCandidates(val, country?.code), 300);
  }

  function handleSelect(c: Candidate) {
    setSelected(c);
    setQuery(c.formatted);
    setOpen(false);
    setCandidates([]);
    setShowMap(false);
    onSelect?.(c);
  }

  function handleMapConfirm(loc: { lat: number; lng: number; formatted: string }) {
    const candidate: Candidate = {
      id: `map-${loc.lat}-${loc.lng}`,
      formatted: loc.formatted,
      lat: loc.lat,
      lng: loc.lng,
    };
    handleSelect(candidate);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  const noResults = searched && !loading && candidates.length === 0 && query.length >= 2;

  const selectClass =
    "w-full appearance-none rounded-(--r-md) bg-surface-2 border border-hairline px-4 py-3.5 pr-10 text-[15px] text-(--text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-ink-spot focus:shadow-[0_0_0_3px_var(--accent-soft)] disabled:opacity-55";

  return (
    <div ref={wrapperRef} className="space-y-2.5">
      {selected && (
        <>
          <input type="hidden" name={name} value={selected.formatted} />
          <input type="hidden" name={`${name}_lat`} value={selected.lat} />
          <input type="hidden" name={`${name}_lng`} value={selected.lng} />
        </>
      )}

      {/* Step 1 — country */}
      <div className="relative">
        <select
          value={country?.code ?? ""}
          onChange={handleCountryChange}
          disabled={disabled}
          className={selectClass}
          aria-label="Country"
        >
          <option value="" disabled>
            Select a country…
          </option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="text-dim pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
          aria-hidden
        />
      </div>

      {/* City search or map picker */}
      {!showMap && (
        <div className="relative">
          <div className="grid *:col-start-1 *:row-start-1">
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => candidates.length > 0 && setOpen(true)}
              placeholder={placeholder}
              required={required && !selected}
              disabled={disabled}
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
              className={`${fieldInputClass} pl-10 leading-normal`}
            />
            <span
              className="text-dim pointer-events-none flex items-center self-center pl-4"
              aria-hidden
            >
              {loading ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <MapPin className="size-4 shrink-0 -translate-y-px" strokeWidth={1.75} />
              )}
            </span>
          </div>

          {open && candidates.length > 0 && (
            <ul
              role="listbox"
              className="border-hairline bg-surface absolute z-50 mt-1 w-full overflow-hidden rounded-xl border shadow-lg"
            >
              {candidates.map((c) => (
                <li key={c.id} role="option" aria-selected={selected?.id === c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="hover:bg-surface-2 flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                  >
                    <MapPin className="text-dim mt-0.5 size-3.5 shrink-0" />
                    <span className="leading-snug">{c.formatted}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-1.5 flex items-center justify-end gap-3">
            {noResults && <p className="text-dim flex-1 text-xs">No results found.</p>}
            <button
              type="button"
              onClick={openMap}
              className="text-ink-spot inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-opacity hover:opacity-80"
            >
              <Map size={11} aria-hidden />
              Pick on map
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <LocationPicker
          center={mapCenter}
          zoom={mapZoom}
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMap(false)}
        />
      )}

      {selected && (
        <p className="text-ink-spot flex items-center gap-1.5 text-xs">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{selected.formatted}</span>
        </p>
      )}
    </div>
  );
}
