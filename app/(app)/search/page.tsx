"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { ArtistCard } from "@/components/artist/artist-card";
import { ArtistCardSkeleton } from "@/components/artist/artist-card-skeleton";
import { cn } from "@/lib/utils";
import { type ArtistPublic } from "@/types/artist";
import {
  tabShellClass,
  sectionHeadClass,
  sectionTitleClass,
  sectionCountClass,
} from "@/lib/ui/classes";

const SEARCH_PHRASES = [
  "fine line botanical, palm-sized, ribcage placement",
  "heavy blackwork mandala on inner forearm",
  "single needle realism portrait of my dog",
  "traditional Americana parrot in saturated color",
];

type Mode = "assistant" | "list";
type Stage = "idle" | "streaming" | "results";

function buildExplanation(query: string) {
  const trimmed = query.trim();
  return `Searching for "${trimmed}". I'm matching artists by style fit, portfolio strength, and proximity. Top picks are sorted by overall match — tap any card to view full work and book a consult.`;
}

export default function SearchPage() {
  const [mode, setMode] = useState<Mode>("assistant");
  const [query, setQuery] = useState("");
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [stream, setStream] = useState("");
  const [recording, setRecording] = useState(false);
  const [results, setResults] = useState<ArtistPublic[]>([]);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (image?.url) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  // FE gap: only `q` hits `/api/artists`. Backend already supports `styles` (comma-separated
  // ArtistStyle slugs → Supabase overlaps on primary_styles). When StyleFilterBar is added,
  // append selected styles here — do not filter the returned list only on the client.
  async function fetchResults(q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/artists?${params}`);
      const json = (await res.json()) as { artists: ArtistPublic[] };
      setResults(json.artists ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function startStream(text: string) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setStream("");
    let i = 0;
    streamTimerRef.current = setInterval(() => {
      i++;
      setStream(text.slice(0, i));
      if (i >= text.length && streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }, 18);
  }

  function submit(text?: string) {
    const q = (text ?? query).trim();
    if (!q && !image) return;

    if (text !== undefined) setQuery(text);
    setStage(mode === "assistant" ? "streaming" : "results");

    fetchResults(q);

    if (mode === "assistant") {
      startStream(buildExplanation(q || (image?.name ?? "your reference")));
      setStage("streaming");
      // Move to results when stream finishes
      setTimeout(() => setStage("results"), Math.max(1200, q.length * 22));
    }
  }

  function reset() {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setStream("");
    setQuery("");
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(null);
    setResults([]);
    setStage("idle");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (image?.url) URL.revokeObjectURL(image.url);
    const url = URL.createObjectURL(file);
    setImage({ url, name: file.name });
    e.target.value = "";
  }

  function toggleMic() {
    type SR = {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (event: { results: { 0: { 0: { transcript: string } } } }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };
    type SRWindow = Window & {
      webkitSpeechRecognition?: new () => SR;
      SpeechRecognition?: new () => SR;
    };

    const w = window as SRWindow;
    const Ctor = w.webkitSpeechRecognition || w.SpeechRecognition;
    if (!Ctor) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (recording) {
      const r = recognitionRef.current as SR | null;
      r?.stop();
      setRecording(false);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  const showSubmitted = stage !== "idle";
  const showStreamCard =
    mode === "assistant" && (stage === "streaming" || (stage === "results" && stream));

  return (
    <div className={cn(tabShellClass, "flex w-full flex-1 flex-col")}>
      {/* Hero */}
      <div className="pb-1.5">
        <h1 className="m-0 text-[32px] leading-none font-medium tracking-[-0.02em] text-(--text)">
          What are you <em className="text-ink-spot not-italic">imagining?</em>
        </h1>
        <div className="text-dim mt-2 font-mono text-[11px] tracking-widest uppercase">
          Describe it · drop a reference · or speak it
        </div>
      </div>

      <div className="h-4" />

      {/* Input wrap with tools row */}
      <div className="bg-surface-2 border-hairline focus-within:border-ink-spot relative mb-3.5 rounded-[14px] border px-3.5 pt-3.5 pb-3 transition-[border-color,box-shadow] focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
        <textarea
          rows={2}
          placeholder="A fine-line hibiscus, single needle, palm-sized, on the ribcage…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="placeholder:text-faint min-h-14 w-full resize-none border-0 bg-transparent font-sans text-[18px] leading-[1.3] tracking-[-0.005em] text-(--text) outline-none"
        />
        <div className="border-hairline mt-2 flex items-center justify-between border-t pt-2.5">
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={image ? "Change reference image" : "Attach reference image"}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "text-dim hover:bg-surface-3 flex size-8 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent transition-colors hover:text-(--text) disabled:cursor-not-allowed disabled:opacity-40",
                image && "text-ink-spot bg-accent-soft",
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={recording ? "Stop recording" : "Search by voice"}
              onClick={toggleMic}
              className={cn(
                "text-dim hover:bg-surface-3 flex size-8 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent transition-colors hover:text-(--text) disabled:cursor-not-allowed disabled:opacity-40",
                recording && "text-ink-spot bg-accent-soft",
              )}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChange} />
          </div>
          <button
            type="button"
            onClick={() => submit(query || SEARCH_PHRASES[0])}
            disabled={loading}
            className="bg-ink-spot flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3.5 font-mono text-[11px] font-medium tracking-[0.12em] text-(--accent-ink) uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Search
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Attached image preview */}
      {image && (
        <div className="bg-surface border-hairline mt-2 flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2">
          <div className="bg-surface-3 relative size-9 shrink-0 overflow-hidden rounded-[6px]">
            <Image
              src={image.url}
              alt={image.name}
              fill
              sizes="36px"
              className="object-cover"
              unoptimized
            />
          </div>
          <span className="text-text-2 flex-1 overflow-hidden font-mono text-[11px] tracking-[0.04em] text-ellipsis whitespace-nowrap">
            {image.name}
          </span>
          <button
            type="button"
            onClick={() => {
              if (image?.url) URL.revokeObjectURL(image.url);
              setImage(null);
            }}
            className="text-dim cursor-pointer border-0 bg-transparent font-mono text-[10px] tracking-[0.14em] uppercase hover:text-(--text)"
          >
            Remove
          </button>
        </div>
      )}

      {/* Segmented Assistant ↔ List only */}
      <div
        role="tablist"
        className="bg-surface-2 border-hairline relative mb-3.5 flex cursor-default rounded-full border p-[3px]"
      >
        <span
          aria-hidden
          className={cn(
            "bg-surface-3 pointer-events-none absolute top-[3px] left-[3px] h-[30px] w-[calc(50%-3px)] rounded-full transition-transform duration-300 ease-(--e-out)",
            mode === "list" && "translate-x-full",
          )}
        />
        <button
          type="button"
          role="tab"
          aria-selected={mode === "assistant"}
          onClick={() => setMode("assistant")}
          className={cn(
            "text-dim relative z-1 flex h-[30px] flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full border-0 bg-transparent font-mono text-[10px] tracking-[0.12em] uppercase",
            mode === "assistant" && "text-(--text)",
          )}
        >
          <span
            className={cn(
              "inline-block size-[5px] rounded-full bg-transparent align-middle transition-[background,box-shadow]",
              mode === "assistant" && "bg-ink-spot shadow-[0_0_6px_var(--accent-glow)]",
            )}
          />
          Assistant
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          onClick={() => setMode("list")}
          className={cn(
            "text-dim relative z-1 flex h-[30px] flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-full border-0 bg-transparent font-mono text-[10px] tracking-[0.12em] uppercase",
            mode === "list" && "text-(--text)",
          )}
        >
          List only
        </button>
      </div>

      {/* Idle: suggestion stack */}
      {!showSubmitted && (
        <div className="pt-1">
          <div className="text-faint mb-2.5 font-mono text-[10px] tracking-[0.14em] uppercase">
            Try one of these
          </div>
          {SEARCH_PHRASES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => submit(p)}
              className="border-hairline flex w-full cursor-pointer items-center gap-2.5 border-x-0 border-t-0 border-b bg-transparent py-3.5 text-left text-(--text) transition-opacity hover:opacity-85"
            >
              <span className="flex-1 font-sans text-[17px] leading-tight text-(--text)">{p}</span>
              <span className="text-faint flex items-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Streaming card (assistant mode only) */}
      {showSubmitted && showStreamCard && (
        <div className="border-hairline from-accent-soft relative mt-3.5 rounded-[14px] border bg-linear-to-b to-transparent p-[18px]">
          <div className="text-ink-spot before:bg-ink-spot mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase before:size-[5px] before:animate-pulse before:rounded-full before:shadow-[0_0_8px_var(--accent-glow)] before:content-['']">
            AI · Search assistant
          </div>
          <div className="font-sans text-[18px] leading-[1.4] tracking-[-0.005em] text-(--text)">
            {stream}
            {stage === "streaming" && (
              <span
                aria-hidden
                className="bg-ink-spot ml-0.5 inline-block h-[18px] w-2 animate-[blink_1s_steps(1)_infinite] align-middle"
              />
            )}
          </div>
        </div>
      )}

      {/* Results section */}
      {showSubmitted && (
        <>
          <div className={cn(sectionHeadClass, "mt-3")}>
            <h2 className={sectionTitleClass}>
              Top <em className="not-italic text-ink-spot">matches</em>
            </h2>
            <span className={sectionCountClass}>
              {loading
                ? "SEARCHING…"
                : `${results.length} ARTIST${results.length !== 1 ? "S" : ""}`}
            </span>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <>
                <ArtistCardSkeleton />
                <ArtistCardSkeleton />
                <ArtistCardSkeleton />
              </>
            ) : results.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No artists matched. Try a different prompt.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-dim mt-4 font-mono text-[11px] tracking-wider uppercase hover:text-(--text)"
                >
                  Reset search
                </button>
              </div>
            ) : (
              results.map((artist, i) => {
                const matchScore = Math.max(0.5, 0.96 - i * 0.05);
                return (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    priority={i < 2}
                    matchScore={matchScore}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
