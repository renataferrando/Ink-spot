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
      <div className="cover">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="initials-fallback" aria-hidden>
            {initials}
          </div>
        )}
        <button
          type="button"
          className="back-btn"
          aria-label="Back"
          onClick={() => router.back()}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="share-btn"
          aria-label="Share profile"
          onClick={handleShare}
        >
          <Share2 size={16} aria-hidden />
        </button>
        {artist.is_demo && (
          <div className="demo-banner">
            <span className="dot" />
            Demo profile · unclaimed
          </div>
        )}
      </div>

      {/* ── Profile head ──────────────────────────────────── */}
      <div className="profile-head">
        {artist.instagram_handle && (
          <div className="handle">@{artist.instagram_handle}</div>
        )}
        <h1 className="name">
          {displayFirst}
          {displayRest && <> <em>{displayRest}</em></>}
        </h1>
        <div className="meta">
          {artist.years_experience != null && (
            <span>{artist.years_experience}&nbsp;yrs</span>
          )}
          {artist.years_experience != null && artist.primary_styles.length > 0 && (
            <span className="sep">·</span>
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
        <div className="location-bar" id="travel">
          <div className="col now">
            <div className="lbl">Now</div>
            <div className="val">
              {artist.current_location?.location_name?.split(",")[0] ?? "—"}
            </div>
            <div className="sub">
              {artist.current_location?.studio_name ?? ""}
            </div>
          </div>
          <div className="arrow" aria-hidden>
            <ArrowRight size={14} />
          </div>
          <div className="col next">
            <div className="lbl">Next</div>
            <div className="val">
              {upcoming?.location_name?.split(",")[0] ?? "Open"}
            </div>
            <div className="sub">
              {upcoming?.starts_at ? formatDateRange(upcoming.starts_at, upcoming.ends_at) : ""}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA row ───────────────────────────────────────── */}
      <div className="cta-row">
        {inquireHref ? (
          <a
            className="btn-primary"
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
            className="btn-primary"
            disabled
            title={inquireDisabledReason}
          >
            <MessageSquare size={14} aria-hidden />
            Inquire
          </button>
        )}
        <a className="btn-secondary" href="#travel">
          <Calendar size={14} aria-hidden />
          Travel dates
        </a>
        <button
          type="button"
          className="btn-icon"
          aria-label="Save artist"
          onClick={showSaveToast}
        >
          <Heart size={18} aria-hidden />
        </button>
      </div>

      {/* ── Bio ───────────────────────────────────────────── */}
      {artist.bio && <div className="bio">{artist.bio}</div>}

      {/* ── Style brief (only when AI summary + style_confidence exist) ── */}
      {styleBreakdown && (
        <div className="section">
          <div className="head">
            <div className="title">Style brief</div>
            <div className="ai-tag">AI · Auto-generated</div>
          </div>
          {artist.style_description && (
            <p className="summary-body">{artist.style_description}</p>
          )}
          <div style={{ height: 18 }} />
          <div className="style-breakdown">
            {styleBreakdown.map(([name, pct]) => (
              <div className="style-row" key={name}>
                <div className="name">{name}</div>
                <div className="bar">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="pct">{pct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Portfolio masonry ─────────────────────────────── */}
      <div className="section">
        <div className="head">
          <div className="title">Portfolio · {artist.portfolio_items.length}</div>
          {artist.portfolio_items.length > 0 && (
            <div className="ai-tag dim">Filter</div>
          )}
        </div>
        {artist.portfolio_items.length > 0 ? (
          <div className="portfolio-grid" style={{ marginLeft: -18, marginRight: -18 }}>
            {artist.portfolio_items.map((item, i) => {
              const tagStyle = item.detected_styles[0] ?? artist.primary_styles[0];
              return (
                <div
                  key={item.id}
                  className={"tile" + (i % 3 === 0 ? " tall" : "")}
                >
                  <Image
                    src={item.image_url}
                    alt={item.alt_text ?? `Tattoo by ${artist.display_name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 320px"
                    className="object-cover"
                    loading={i < 2 ? "eager" : "lazy"}
                  />
                  {tagStyle && (
                    <div className="overlay">
                      <div className="style-tag">{STYLE_LABELS[tagStyle]}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="portfolio-empty">No portfolio uploaded yet</div>
        )}
      </div>

      {/* ── Q&A panel shell (Stage 5.5.3 wires this) ─────── */}
      {!artist.is_demo && (
        <div className="qa-panel">
          <div className="qa-head">
            <div className="lhs">
              <div className="glow" />
              <div className="ttl">Ask about {displayFirst}</div>
            </div>
            <div className="pill">AI · Coming soon</div>
          </div>
          <div className="qa-body placeholder">
            Conversational Q&amp;A unlocks in Phase 5.5
          </div>
          <div className="qa-suggested">
            {QA_SUGGESTIONS.map((q) => (
              <button key={q} type="button" disabled>
                {q}
              </button>
            ))}
          </div>
          <div className="qa-input">
            <input
              placeholder={`Ask about ${displayFirst}'s work, style, availability…`}
              disabled
            />
            <button className="send" type="button" disabled aria-label="Send">
              <ArrowUp size={14} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* ── URL footer ────────────────────────────────────── */}
      <div className="profile-footer">
        inkspot.cr · /artist/{artist.handle}
      </div>

      {/* ── Save toast (pre-Stage 5.3) ────────────────────── */}
      {savedToast && (
        <div className="save-toast" role="status" aria-live="polite">
          <Heart size={14} aria-hidden />
          <span>Sign in to save</span>
          <Link href="/login">Log in</Link>
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
