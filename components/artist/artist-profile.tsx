"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Calendar,
  ChevronLeft,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react";

import type { ArtistPublic } from "@/types/artist";
import { STYLE_LABELS } from "@/types/artist";
import { cn } from "@/lib/utils";
import { btnPrimaryClass, btnSecondaryClass, pageColumnClass } from "@/lib/ui/classes";

interface ArtistProfileProps {
  artist: ArtistPublic;
}

/**
 * Public artist profile page (Phase 3, Stage 3.7).
 *
 * Layout matches the Claude Design handoff bundle:
 *   cover → head → location bar → CTA row → bio → style-brief shell →
 *   portfolio masonry → Q&A shell → URL footer.
 *
 * Stage 5.3 will swap the Save heart's toast for a real Server Action;
 * Stages 4.1 + 5.5.2 will populate the Style brief; Stage 5.5.3 will
 * activate the Q&A panel input + suggestion chips.
 */
export function ArtistProfile({ artist }: ArtistProfileProps) {
  console.log(artist);
  const router = useRouter();
  const [savedToast, setSavedToast] = useState(false);

  const initials = artist.display_name.slice(0, 2).toUpperCase();
  const firstPortfolioImage = artist.portfolio_items[0]?.image_url ?? null;

  // Cover fallback chain: explicit cover → first portfolio → initials block
  const coverSrc = artist.cover_image_url ?? firstPortfolioImage;

  // Display name: split into "first" and "rest" so the second word
  // gets the accent <em> treatment per the design.
  const nameParts = artist.display_name.trim().split(/\s+/);
  const displayFirst = nameParts[0];
  const displayRest = nameParts.slice(1).join(" ");

  // Inquire CTA priority: mailto → IG DM → disabled.
  const inquireHref =
    (artist.contact_email && `mailto:${artist.contact_email}`) ||
    (artist.instagram_handle && `https://instagram.com/${artist.instagram_handle}`) ||
    null;
  const inquireLabel = artist.contact_email
    ? "Email"
    : artist.instagram_handle
      ? "DM on IG"
      : "Inquire";
  const inquireDisabledReason =
    "No public contact for this artist yet — try the Save action and check back later.";

  const upcoming = artist.upcoming_locations?.[0] ?? null;
  const styleBreakdown = buildStyleBreakdownStub();

  function showSaveToast() {
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 3500);
  }

  function handleShare() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/artist/${artist.handle}`;
    if (navigator.share) {
      navigator.share({ title: artist.display_name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  return (
    <>
      {/* ── Cover ─────────────────────────────────────────── */}
      <div className="bg-surface-2 relative h-[300px] w-full overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0.9)_100%)] after:content-['']">
        {coverSrc ? (
          <Image src={coverSrc} alt="" fill sizes="100vw" priority className="object-cover" />
        ) : (
          <div
            aria-hidden
            className="text-faint absolute inset-0 flex items-center justify-center font-mono text-[64px] tracking-[0.04em] uppercase"
          >
            {initials}
          </div>
        )}
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="absolute top-3.5 left-3.5 z-5 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-[10px] transition-colors hover:bg-black/70"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Share profile"
          onClick={handleShare}
          className="absolute top-3.5 right-3.5 z-5 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-[10px] transition-colors hover:bg-black/70"
        >
          <Share2 size={16} aria-hidden />
        </button>
        {artist.is_demo && (
          <div className="border-hairline text-text-2 absolute top-[54px] left-3.5 z-4 flex items-center gap-1.5 rounded-full border bg-black/70 px-2.5 py-1.5 font-mono text-[10px] tracking-widest uppercase backdrop-blur-[10px]">
            <span className="size-1.5 rounded-full bg-[#ffb340]" />
            Demo profile · unclaimed
          </div>
        )}
      </div>

      <div className={cn(pageColumnClass, "w-full")}>
        {/* ── Profile head ──────────────────────────────────── */}
        <div className="relative z-5 -mt-12 px-[18px] pt-2">
          {artist.instagram_handle && (
            <div className="text-text-2 mb-2 font-mono text-[12px]">@{artist.instagram_handle}</div>
          )}
          <h1 className="mb-2 text-[44px] leading-[0.95] font-medium tracking-[-0.02em]">
            {displayFirst}
            {displayRest && (
              <>
                {" "}
                <em className="text-ink-spot not-italic">{displayRest}</em>
              </>
            )}
          </h1>
          <div className="text-text-2 mt-2 flex items-center gap-3 text-[13px]">
            {artist.years_experience != null && <span>{artist.years_experience}&nbsp;yrs</span>}
            {artist.years_experience != null && artist.primary_styles.length > 0 && (
              <span className="text-faint">·</span>
            )}
            {artist.primary_styles.length > 0 && (
              <span>
                {artist.primary_styles
                  .slice(0, 2)
                  .map((s) => STYLE_LABELS[s])
                  .join(" / ")}
              </span>
            )}
          </div>
        </div>

        {/* ── Location bar (Now → Next) ─────────────────────── */}
        {(artist.current_location || upcoming) && (
          <div
            id="travel"
            className="bg-surface border-hairline mx-[18px] mt-5 mb-0 flex min-w-0 items-center gap-3.5 rounded-[14px] border px-4 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-faint font-mono text-[9px] tracking-[0.14em] uppercase">
                  <span className="bg-ink-spot mr-1.5 inline-block size-1.5 rounded-full align-middle shadow-[0_0_8px_var(--accent-glow)]" />
                  Now
                </div>
                {artist.current_location && (
                  <Link
                    href="/explore"
                    className="text-dim hover:text-(--text) shrink-0 font-mono text-[9px] tracking-widest uppercase transition-colors"
                  >
                    Map →
                  </Link>
                )}
              </div>
              <div className="mt-0.5 truncate text-[18px] leading-[1.2] text-(--text)">
                {artist.current_location?.location_name?.split(",")[0] ?? "—"}
              </div>
              <div className="text-dim mt-0.5 font-mono text-[10px]">
                {artist.current_location?.studio_name ?? ""}
              </div>
            </div>
            <div aria-hidden className="text-faint flex shrink-0 items-center">
              <ArrowRight size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-faint font-mono text-[9px] tracking-[0.14em] uppercase">
                Next
              </div>
              <div className="text-text-2 mt-0.5 truncate text-[18px] leading-[1.2]">
                {upcoming?.location_name?.split(",")[0] ?? "Open"}
              </div>
              <div className="text-dim mt-0.5 font-mono text-[10px]">
                {upcoming?.starts_at ? formatDateRange(upcoming.starts_at, upcoming.ends_at) : ""}
              </div>
            </div>
          </div>
        )}

        {/* ── CTA row ───────────────────────────────────────── */}
        <div className="mt-4 flex min-w-0 gap-2 px-[18px]">
          {inquireHref ? (
            <a
              className={cn(btnPrimaryClass, "w-auto! min-w-0 flex-1")}
              href={inquireHref}
              target={inquireHref.startsWith("http") ? "_blank" : undefined}
              rel={inquireHref.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              <MessageSquare size={14} aria-hidden />
              {inquireLabel}
            </a>
          ) : (
            <button
              type="button"
              className={cn(btnPrimaryClass, "w-auto! min-w-0 flex-1")}
              disabled
              title={inquireDisabledReason}
            >
              <MessageSquare size={14} aria-hidden />
              Inquire
            </button>
          )}
          <a className={cn(btnSecondaryClass, "min-w-0 flex-1")} href="#travel">
            <Calendar size={14} aria-hidden />
            Travel dates
          </a>
          <button
            type="button"
            aria-label="Save artist"
            onClick={showSaveToast}
            className="bg-surface-2 border-ds-border hover:bg-surface-3 flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border text-(--text) transition-colors"
          >
            <Heart size={18} aria-hidden />
          </button>
        </div>

        {/* ── Bio ───────────────────────────────────────────── */}
        {artist.bio && (
          <div className="text-text-2 px-[18px] pt-6 pb-2 text-[18px] leading-relaxed">
            {artist.bio}
          </div>
        )}

        {/* ── Style brief (only when AI summary + style_confidence exist) ── */}
        {styleBreakdown && (
          <div className="border-hairline mt-8 border-t px-[18px] pt-7 pb-6">
            <div className="mb-3.5 flex items-baseline justify-between">
              <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
                Style brief
              </div>
              <div className="text-ink-spot before:bg-ink-spot inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase before:size-1 before:rounded-full before:content-['']">
                AI · Auto-generated
              </div>
            </div>
            {artist.style_description && (
              <p className="text-[19px] leading-[1.45] text-pretty text-(--text)">
                {artist.style_description}
              </p>
            )}
            <div className="h-[18px]" />
            <div className="flex flex-col gap-2.5">
              {styleBreakdown.map(([name, pct]) => (
                <div className="flex items-center gap-2.5 font-mono text-[11px]" key={name}>
                  <div className="text-text-2 w-20 tracking-[0.06em] uppercase">{name}</div>
                  <div className="bg-surface-3 h-1 flex-1 overflow-hidden rounded-[2px]">
                    <div
                      className={`bg-ink-spot h-full w-[${pct}%] shadow-[0_0_8px_var(--accent-glow)]`}
                    />
                  </div>
                  <div className="text-dim w-8 text-right text-[10px]">{pct}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Portfolio masonry ─────────────────────────────── */}
        <div className="border-hairline mt-8 border-t px-[18px] pt-7 pb-6">
          <div className="mb-3.5 flex items-baseline justify-between">
            <div className="text-dim font-mono text-[10px] tracking-[0.16em] uppercase">
              Portfolio · {artist.portfolio_items.length}
            </div>
            {artist.portfolio_items.length > 0 && (
              <div className="text-dim before:bg-dim inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase before:size-1 before:rounded-full before:content-['']">
                Filter
              </div>
            )}
          </div>
          {artist.portfolio_items.length > 0 ? (
            <div className="mx-[-18px] grid grid-cols-2 gap-1 px-1">
              {artist.portfolio_items.map((item, i) => {
                const tagStyle = item.detected_styles[0] ?? artist.primary_styles[0];
                const tall = i % 3 === 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-surface-2 group relative cursor-pointer overflow-hidden ${tall ? "aspect-[0.75]" : "aspect-square"}`}
                  >
                    <Image
                      src={item.image_url}
                      alt={item.alt_text ?? `Tattoo by ${artist.display_name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 320px"
                      className="object-cover transition-transform duration-400 ease-(--e-out) group-hover:scale-105"
                      loading={i < 2 ? "eager" : "lazy"}
                    />
                    {tagStyle && (
                      <div className="pointer-events-none absolute right-0 bottom-0 left-0 bg-linear-to-b from-transparent to-black/85 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="font-mono text-[9px] tracking-[0.12em] text-white uppercase">
                          {STYLE_LABELS[tagStyle]}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-hairline text-dim mx-[18px] rounded-[14px] border border-dashed px-[18px] py-8 text-center font-mono text-[11px] tracking-[0.08em] uppercase">
              No portfolio uploaded yet
            </div>
          )}
        </div>

        {/* ── Q&A panel shell (Stage 5.5.3 wires this) ─────── */}
        {!artist.is_demo && (
          <div className="bg-surface border-hairline mx-[18px] mt-8 mb-8 overflow-hidden rounded-[18px] border">
            <div className="border-hairline flex items-center justify-between border-b px-[18px] py-4">
              <div className="flex items-center gap-2.5">
                <div className="after:bg-ink-spot relative size-6 rounded-full bg-[radial-gradient(circle,var(--accent)_0%,transparent_70%)] after:absolute after:inset-2 after:rounded-full after:content-['']" />
                <div className="text-[17px]">Ask about {displayFirst}</div>
              </div>
              <div className="text-dim border-hairline rounded-full border px-2 py-1 font-mono text-[9px] tracking-[0.14em] uppercase">
                AI · Coming soon
              </div>
            </div>
            <div className="text-dim flex min-h-24 items-center justify-center px-[18px] py-3.5 font-mono text-[13px] tracking-[0.08em] uppercase">
              Conversational Q&amp;A unlocks in Phase 5.5
            </div>
            <div className="flex flex-wrap gap-1.5 px-[18px] pb-3.5">
              {QA_SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled
                  className="text-text-2 border-hairline cursor-not-allowed rounded-full border bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="border-hairline flex items-center gap-2 border-t px-3.5 py-3">
              <input
                placeholder={`Ask about ${displayFirst}'s work, style, availability…`}
                disabled
                className="placeholder:text-faint disabled:text-dim h-8 flex-1 border-0 bg-transparent text-[14px] outline-none"
              />
              <button
                type="button"
                disabled
                aria-label="Send"
                className="bg-ink-spot flex size-8 cursor-not-allowed items-center justify-center rounded-full border-0 text-(--accent-ink) opacity-45"
              >
                <ArrowUp size={14} aria-hidden />
              </button>
            </div>
          </div>
        )}

        {/* ── URL footer ────────────────────────────────────── */}
        <div className="text-faint px-[18px] pb-8 text-center font-mono text-[10px] tracking-[0.14em] uppercase">
          inkspot.cr · /artist/{artist.handle}
        </div>
      </div>

      {/* ── Save toast (pre-Stage 5.3) ────────────────────── */}
      {savedToast && (
        <div
          role="status"
          aria-live="polite"
          className="bg-surface border-ink-spot fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 animate-[toast-in_0.18s_var(--e-out)] items-center gap-2.5 rounded-full border px-4 py-3 text-[13px] text-(--text) shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
        >
          <Heart size={14} aria-hidden />
          <span>Sign in to save</span>
          <Link
            href="/login"
            className="text-ink-spot font-mono text-[11px] tracking-widest uppercase"
          >
            Log in
          </Link>
        </div>
      )}
    </>
  );
}

const QA_SUGGESTIONS = [
  "Does she travel for clients?",
  "Availability this month?",
  "Cover-up work?",
  "Pricing range",
];

/**
 * Style breakdown stub.
 *
 * Pre-Phase-4 we don't have `portfolio_items.style_confidence` populated and
 * we don't have an `ai_artist_summaries` row, so the section stays hidden.
 * Once Stage 4.1 lands the per-item confidence and Stage 5.5.2 generates the
 * narrative summary, this helper will be replaced by a real aggregation that
 * accepts the artist (already documented in PLAN Stage 4.1 + 5.5.2).
 */
function buildStyleBreakdownStub(): Array<[string, number]> | null {
  return null;
}

function formatDateRange(start: string, end?: string | null) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
    const startStr = fmt.format(new Date(start));
    if (!end) return startStr;
    const endStr = fmt.format(new Date(end));
    return `${startStr}–${endStr}`;
  } catch {
    return "";
  }
}
