"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { ArtistCard } from "@/components/artist/artist-card";
import { ArtistCardSkeleton } from "@/components/artist/artist-card-skeleton";
import { type ArtistPublic } from "@/types/artist";

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
  const [mode, setMode]               = useState<Mode>("assistant");
  const [query, setQuery]             = useState("");
  const [image, setImage]             = useState<{ url: string; name: string } | null>(null);
  const [stage, setStage]             = useState<Stage>("idle");
  const [stream, setStream]           = useState("");
  const [recording, setRecording]     = useState(false);
  const [results, setResults]         = useState<ArtistPublic[]>([]);
  const [loading, setLoading]         = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    if (image?.url) URL.revokeObjectURL(image.url);
  }, [image]);

  async function fetchResults(q: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res  = await fetch(`/api/artists?${params}`);
      const json = await res.json() as { artists: ArtistPublic[] };
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
  const showStreamCard = mode === "assistant" && (stage === "streaming" || (stage === "results" && stream));

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col pb-24">
      {/* Hero */}
      <div className="search-hero pt-6">
        <h1 className="title">
          What are you <em>imagining?</em>
        </h1>
        <div className="sub">Describe it · drop a reference · or speak it</div>
      </div>

      <div style={{ height: 16 }} />

      {/* Input wrap with tools row */}
      <div className="search-input-wrap">
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
        />
        <div className="search-tools">
          <div className="left">
            <button
              type="button"
              className={`icon-btn${image ? " active" : ""}`}
              aria-label={image ? "Change reference image" : "Attach reference image"}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M3 7h4l2-3h6l2 3h4v13H3z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <button
              type="button"
              className={`icon-btn${recording ? " active" : ""}`}
              aria-label={recording ? "Stop recording" : "Search by voice"}
              onClick={toggleMic}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />
          </div>
          <button
            type="button"
            className="submit"
            onClick={() => submit(query || SEARCH_PHRASES[0])}
            disabled={loading}
          >
            Search
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Attached image preview */}
      {image && (
        <div className="attached-image">
          <div className="thumb">
            <Image src={image.url} alt={image.name} fill sizes="36px" className="object-cover" unoptimized />
          </div>
          <span className="name">{image.name}</span>
          <button
            type="button"
            className="remove"
            onClick={() => {
              if (image?.url) URL.revokeObjectURL(image.url);
              setImage(null);
            }}
          >
            Remove
          </button>
        </div>
      )}

      {/* Segmented Assistant ↔ List only */}
      <div className={`assistant-toggle${mode === "list" ? " right" : ""}`} role="tablist">
        <div className="pill" aria-hidden />
        <button
          type="button"
          role="tab"
          aria-selected={mode === "assistant"}
          className={mode === "assistant" ? "on" : ""}
          onClick={() => setMode("assistant")}
        >
          <span className="ai-dot" />Assistant
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          className={mode === "list" ? "on" : ""}
          onClick={() => setMode("list")}
        >
          List only
        </button>
      </div>

      {/* Idle: suggestion stack */}
      {!showSubmitted && (
        <div className="suggestion-stack">
          <div className="head">Try one of these</div>
          {SEARCH_PHRASES.map((p) => (
            <button key={p} type="button" className="suggestion" onClick={() => submit(p)}>
              <span className="q">{p}</span>
              <span className="arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Streaming card (assistant mode only) */}
      {showSubmitted && showStreamCard && (
        <div className="assistant-stream">
          <div className="badge">AI · Search assistant</div>
          <div className="copy">
            {stream}
            {stage === "streaming" && <span className="cursor" aria-hidden />}
          </div>
        </div>
      )}

      {/* Results section */}
      {showSubmitted && (
        <>
          <div className="section-head" style={{ marginTop: 12 }}>
            <h2 className="title">
              Top <em>matches</em>
            </h2>
            <span className="count">
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
              <div className="px-[18px] py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No artists matched. Try a different prompt.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 font-mono text-[11px] uppercase tracking-wider text-dim hover:text-(--text)"
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

      <div style={{ height: 40 }} />
    </div>
  );
}
