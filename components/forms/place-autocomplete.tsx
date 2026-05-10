"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Candidate {
  id: string;
  formatted: string;
  lat: number;
  lng: number;
}

interface PlaceAutocompleteProps {
  name?: string;       // base name used for hidden inputs (default: "address")
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
  const [query,      setQuery]      = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [open,       setOpen]       = useState(false);
  const [selected,   setSelected]   = useState<Candidate | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchCandidates = useCallback(async (q: string) => {
    if (q.length < 2) { setCandidates([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/geocoding/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { candidates: Candidate[] };
      setCandidates(data.candidates ?? []);
      setOpen(data.candidates.length > 0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setSelected(null); // clear selection when user types again
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchCandidates(val), 300);
  }

  function handleSelect(c: Candidate) {
    setSelected(c);
    setQuery(c.formatted);
    setOpen(false);
    setCandidates([]);
    onSelect?.(c);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* Hidden fields carry the resolved values to the Server Action */}
      {selected && (
        <>
          <input type="hidden" name={name}      value={selected.formatted} />
          <input type="hidden" name={`${name}_lat`} value={selected.lat} />
          <input type="hidden" name={`${name}_lng`} value={selected.lng} />
        </>
      )}

      <div className="relative">
        {loading ? (
          <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
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
          className="pl-9"
        />
      </div>

      {/* Selected place chip */}
      {selected && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-primary">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{selected.formatted}</span>
        </p>
      )}

      {/* Dropdown */}
      {open && candidates.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {candidates.map((c) => (
            <li key={c.id} role="option" aria-selected={selected?.id === c.id}>
              <button
                type="button"
                onClick={() => handleSelect(c)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="leading-snug">{c.formatted}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
