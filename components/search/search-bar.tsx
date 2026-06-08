"use client";

import { Image as ImageIcon, Mic, Search, X } from "lucide-react";
import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { btnPrimarySm } from "@/lib/ui/classes";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  className?: string;
}

export function SearchBar({ onSearch, loading, className }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [voiceSupported] = useState(
    () => typeof window !== "undefined" && "webkitSpeechRecognition" in window,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function handleClear() {
    setValue("");
    onSearch("");
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex items-center gap-2", className)}
      role="search"
    >
      <div className="relative flex-1">
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search styles, techniques…"
          className="pr-16 pl-9"
          aria-label="Search artists"
          disabled={loading}
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground rounded p-0.5"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded p-0.5"
            aria-label="Search by image"
          >
            <ImageIcon className="size-3.5" aria-hidden />
          </button>
          {voiceSupported && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded p-0.5"
              aria-label="Search by voice"
            >
              <Mic className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <button type="submit" className={btnPrimarySm} disabled={loading || !value.trim()}>
        Search
      </button>
    </form>
  );
}
