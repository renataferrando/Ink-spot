"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import Lenis from "lenis";

// ── Constants ───────────────────────────────────────────────────────────────

const TEAL = "#27b7a5";
const TEAL_GLOW = "rgba(39, 183, 165, 0.42)";
const TEAL_SOFT = "rgba(39, 183, 165, 0.12)";
const E_OUT: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

const PORTFOLIO_IMGS: Record<string, string> = {
  "luna-1": "https://images.unsplash.com/photo-1555427688-34f53f812abb",
  "kai-1": "https://images.unsplash.com/photo-1570877037877-d3c5f05d09a0",
  "kai-2": "https://images.unsplash.com/photo-1590403823825-8dbc090b8e95",
  "tomas-1": "https://images.unsplash.com/photo-1533158326339-7f3cf2404354",
  "mari-2": "https://images.unsplash.com/photo-1548690596-f1b6d71b9ba7",
  "luna-avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "kai-avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "tomas-avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
};

const img = (seed: string, w = 600, h = 600) => {
  const base = PORTFOLIO_IMGS[seed];
  return base
    ? `${base}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
    : `https://picsum.photos/seed/inkspot-${seed}/${w}/${h}`;
};

const ARTISTS_MOCK = [
  {
    name: "Luna Vargas",
    avatar: img("luna-avatar", 200, 200),
    portfolio0: img("luna-1", 600, 800),
    styles: "Fine Line · Minimalist",
  },
  {
    name: "Kai Mendoza",
    avatar: img("kai-avatar", 200, 200),
    portfolio0: img("kai-1", 600, 800),
    styles: "Blackwork · Geometric",
  },
  {
    name: "Tomas Reyes",
    avatar: img("tomas-avatar", 200, 200),
    portfolio0: img("tomas-1", 600, 800),
    styles: "Dotwork · Geometric",
  },
];

const SHOWCASE_CARDS = [
  { artist: ARTISTS_MOCK[0], pct: 96, style: "Fine Line" },
  { artist: ARTISTS_MOCK[1], pct: 91, style: "Blackwork" },
  { artist: ARTISTS_MOCK[2], pct: 84, style: "Dotwork" },
];

const FLOATS = [
  {
    src: "/landing/float-fine-line.png",
    speed: 80,
    delay: 0.45,
    bob: 0,
    w: 172,
    h: 228,
    top: "6%",
    right: "7%",
  },
  {
    src: "/landing/float-blackwork.png",
    speed: 152,
    delay: 0.6,
    bob: -2,
    w: 144,
    h: 190,
    top: "20%",
    right: "31%",
  },
  {
    src: "/landing/float-dotwork.png",
    speed: 224,
    delay: 0.75,
    bob: -4,
    w: 168,
    h: 222,
    bottom: "7%",
    right: "10%",
  },
  {
    src: "/landing/float-realism.png",
    speed: 296,
    delay: 0.9,
    bob: -6,
    w: 138,
    h: 182,
    bottom: "9%",
    right: "33%",
  },
] as const;

const ROTOR_WORDS = ["blackwork", "fine line", "dotwork", "realism", "watercolor"];

const MARQUEE = [
  "Blackwork",
  "Fine Line",
  "Dotwork",
  "Realism",
  "Watercolor",
  "Geometric",
  "Japanese",
  "Sacred",
  "Minimalist",
  "Traditional",
];

const HOW_STEPS = [
  {
    k: "Search",
    h: "Describe it. Snap it. Say it.",
    p: "Type a vibe, drop a reference photo, or use your voice. InkSpot reads the style of the work itself — not just hashtags.",
  },
  {
    k: "Match",
    h: "Style meets proximity.",
    p: "Every artist is ranked 60% on how closely their work matches yours and 40% on how near they are right now. The best fit rises to the top.",
  },
  {
    k: "Book",
    h: "Catch them while they're in town.",
    p: "Artists are nomadic. See who's near you today and who leaves Friday, then reach out before the chair fills up.",
  },
];

// ── Primitives ──────────────────────────────────────────────────────────────

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width={size}
      height={size}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-[7px] font-bold tracking-[-0.02em] ${className}`}
    >
      InkSpot
      <i
        className="block h-[7px] w-[7px] shrink-0 rounded-full not-italic"
        style={{ background: "var(--accent)", boxShadow: "0 0 12px var(--accent-glow)" }}
      />
    </Link>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav({ scrollTo }: { scrollTo: (id: string) => void }) {
  return (
    <header
      className="lp-nav sticky top-0 z-30 flex items-center justify-between"
      style={{
        padding: "0 40px",
        height: 70,
        background: "linear-gradient(180deg, rgba(5,5,5,0.86) 0%, rgba(5,5,5,0) 100%)",
        backdropFilter: "blur(4px)",
      }}
    >
      <Wordmark className="text-[22px]" />

      <nav className="hidden gap-1 sm:flex">
        {[
          { label: "How it works", id: "how" },
          { label: "The match", id: "showcase" },
        ].map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="cursor-pointer rounded-full px-[14px] py-2 text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white/5 hover:text-white"
            style={{ fontFamily: "var(--mono)", color: "var(--text-2)" }}
          >
            {label}
          </button>
        ))}
        <Link
          href="/login"
          className="rounded-full px-[14px] py-2 text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white/5 hover:text-white"
          style={{ fontFamily: "var(--mono)", color: "var(--text-2)" }}
        >
          For artists
        </Link>
      </nav>

      <Link
        href="/explore"
        className="inline-flex h-[38px] items-center gap-2 rounded-full px-[18px] text-[11px] font-semibold tracking-[0.12em] uppercase transition-all hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,255,255,0.18)]"
        style={{ fontFamily: "var(--mono)", background: "var(--text)", color: "#050505" }}
      >
        Open app <ArrowRight size={14} />
      </Link>
    </header>
  );
}

// ── Rotor word ───────────────────────────────────────────────────────────────

function RotorWord() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTOR_WORDS.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="mt-7 flex items-center gap-3"
      style={{
        fontFamily: "var(--mono)",
        fontSize: "clamp(14px, 1.4vw, 19px)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ color: "var(--text-2)", whiteSpace: "nowrap" }}>matched for</span>
      <div
        className="relative overflow-hidden"
        style={{ height: "1.5em", minWidth: "13.5ch", color: TEAL, lineHeight: "1.5em" }}
      >
        <AnimatePresence mode="wait">
          <motion.b
            key={ROTOR_WORDS[idx]}
            initial={{ y: "70%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-70%", opacity: 0 }}
            transition={{ duration: 0.55, ease: E_OUT }}
            className="absolute top-0 left-0 font-semibold"
            style={{ lineHeight: "1.5em" }}
          >
            {ROTOR_WORDS[idx]}
          </motion.b>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Floating portfolio image ─────────────────────────────────────────────────

function FloatImg({
  src,
  delay = 0,
  bob = 0,
  speed = 80,
  floatIdx = 0,
  w,
  h,
  top,
  bottom,
  right,
}: {
  src: string;
  delay?: number;
  bob?: number;
  speed?: number;
  floatIdx?: number;
  w: number;
  h: number;
  top?: string;
  bottom?: string;
  right: string;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -(speed * 0.08)]);

  return (
    <motion.div
      className={`lp-float-${floatIdx} absolute overflow-hidden rounded-2xl`}
      style={{
        width: w,
        height: h,
        top,
        bottom,
        right,
        border: "1px solid var(--hairline)",
        boxShadow: "0 40px 80px -24px rgba(0,0,0,0.85)",
        filter: "grayscale(1) contrast(1.06) brightness(0.82)",
        y,
        zIndex: 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay, ease: E_OUT }}
    >
      {/* Duotone tint */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 2,
          background: `linear-gradient(150deg, var(--accent) 0%, transparent 55%), ${TEAL_SOFT}`,
          mixBlendMode: "soft-light",
          opacity: 0.7,
        }}
      />
      {/* Scrim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 2,
          background: "linear-gradient(180deg, transparent 45%, rgba(5,5,5,0.75))",
        }}
      />
      {/* Bob */}
      <motion.img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        style={{ scale: 1.08 }}
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: bob }}
      />
    </motion.div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const headLines: { text: React.ReactNode; delay: number }[] = [
    { text: "Find your", delay: 0.05 },
    { text: "tattoo", delay: 0.14 },
    {
      text: (
        <em
          style={{
            fontStyle: "normal",
            background: `linear-gradient(100deg, var(--accent), ${TEAL})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          artist
        </em>
      ),
      delay: 0.23,
    },
  ];

  return (
    <section
      className="lp-hero relative flex flex-col justify-center overflow-hidden"
      style={{ minHeight: "100vh", padding: "80px 40px 150px" }}
    >
      {/* Kicker */}
      <motion.div
        className="mb-7 flex items-center gap-3"
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "var(--text-2)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: E_OUT }}
      >
        <span
          className="h-px w-7 shrink-0"
          style={{ background: "var(--accent)", boxShadow: "0 0 10px var(--accent-glow)" }}
        />
        Style-matched · Geolocated · Wherever you are
      </motion.div>

      {/* Headline */}
      <h1
        className="lp-headline font-bold uppercase"
        style={{
          fontSize: "clamp(48px, 7.8vw, 138px)",
          lineHeight: 0.86,
          letterSpacing: "-0.04em",
          maxWidth: "min(52%, 680px)",
        }}
      >
        {headLines.map(({ text, delay }, i) => (
          <span key={i} className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block"
              initial={{ y: "112%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.05, delay, ease: E_OUT }}
            >
              {text}
            </motion.span>
          </span>
        ))}
      </h1>

      {/* Rotor */}
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.38, ease: E_OUT }}
      >
        <RotorWord />
      </motion.div>

      {/* Sub */}
      <motion.p
        className="mt-9 max-w-[46ch] leading-[1.55]"
        style={{ fontSize: "clamp(15px, 1.5vw, 19px)", color: "var(--text-2)" }}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: E_OUT }}
      >
        InkSpot matches you with tattoo artists by the style of their work and by where they are
        right now — across cities, beaches, and everywhere the needle travels.
      </motion.p>

      {/* CTA row */}
      <motion.div
        className="mt-[38px] flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.65, ease: E_OUT }}
      >
        <Link
          href="/explore"
          className="lp-cta-btn inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_var(--accent-glow)] sm:justify-start"
          style={{
            fontFamily: "var(--mono)",
            background: "var(--accent)",
            boxShadow: "0 10px 40px -8px var(--accent-glow)",
          }}
        >
          Find an artist <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="lp-cta-btn inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 text-xs font-semibold tracking-[0.12em] uppercase transition-all hover:-translate-y-0.5 hover:border-[#27b7a5] hover:text-[#27b7a5] sm:justify-start"
          style={{
            fontFamily: "var(--mono)",
            color: "var(--text)",
            border: "1px solid var(--border-ds)",
          }}
        >
          Join as an artist
        </Link>
      </motion.div>

      {/* Floating images (desktop only) */}
      {FLOATS.map((f, i) => (
        <FloatImg
          key={i}
          floatIdx={i}
          src={f.src}
          delay={f.delay}
          bob={f.bob}
          speed={f.speed}
          w={f.w}
          h={f.h}
          top={"top" in f ? f.top : undefined}
          bottom={"bottom" in f ? f.bottom : undefined}
          right={f.right}
        />
      ))}

      {/* Scroll cue */}
      <div
        className="lp-scroll-cue absolute bottom-9 left-10 flex items-center gap-3"
        style={{
          fontFamily: "var(--mono)",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--faint)",
        }}
      >
        <div
          className="relative h-10 w-px overflow-hidden"
          style={{ background: "var(--border-ds)" }}
        >
          <motion.div
            className="absolute left-0 w-px"
            style={{ height: "40%", background: TEAL, boxShadow: `0 0 8px ${TEAL_GLOW}` }}
            animate={{ top: ["-40%", "100%"] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        Scroll
      </div>
    </section>
  );
}

// ── Marquee ───────────────────────────────────────────────────────────────────

function MarqueeSection() {
  const items = [...MARQUEE, ...MARQUEE];

  return (
    <div
      className="overflow-hidden py-6"
      style={{
        borderTop: "1px solid var(--hairline)",
        borderBottom: "1px solid var(--hairline)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <motion.div
        className="inline-flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {items.map((s, i) => (
          <span
            key={i}
            className="lp-marquee-item inline-flex items-center gap-[26px] px-[26px]"
            style={{
              fontSize: "30px",
              letterSpacing: "-0.01em",
              color: i % 3 === 1 ? "var(--faint)" : "var(--text)",
            }}
          >
            {s}
            <span
              className="block h-[7px] w-[7px] shrink-0 rounded-full"
              style={{ background: TEAL, boxShadow: `0 0 10px ${TEAL_GLOW}` }}
            />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── How it works — mock UIs ───────────────────────────────────────────────────

function MockCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-[620px] rounded-[20px] p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        boxShadow: "0 40px 90px -30px rgba(0,0,0,0.9)",
      }}
    >
      {children}
    </div>
  );
}

function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4"
      style={{
        fontFamily: "var(--mono)",
        fontSize: "10px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--faint)",
      }}
    >
      {children}
    </div>
  );
}

function MockGoBtn({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex h-[38px] items-center gap-[6px] rounded-full px-4 text-white"
      style={{
        background: "var(--accent)",
        fontFamily: "var(--mono)",
        fontSize: "11px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function HowMockSearch() {
  return (
    <MockCard>
      <MockLabel>New search</MockLabel>
      <div style={{ fontSize: "22px", lineHeight: 1.3, color: "var(--text)" }}>
        fine line botanical, ribcage, palm-sized
      </div>
      <div className="mt-5 flex gap-2">
        {[
          <svg
            key="cam"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-[18px] w-[18px]"
          >
            <rect x="2" y="7" width="20" height="15" rx="2" />
            <circle cx="12" cy="14" r="3" />
            <path d="M16 7V5H8v2" />
          </svg>,
          <svg
            key="mic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-[18px] w-[18px]"
          >
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0014 0" />
            <line x1="12" y1="22" x2="12" y2="17" />
          </svg>,
        ].map((icon, j) => (
          <div
            key={j}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px]"
            style={{
              border: "1px solid var(--hairline)",
              background: "var(--surface-2)",
              color: "var(--dim)",
            }}
          >
            {icon}
          </div>
        ))}
        <div className="ml-auto">
          <MockGoBtn>
            Search <ArrowRight size={13} />
          </MockGoBtn>
        </div>
      </div>
    </MockCard>
  );
}

function HowMockMatch() {
  return (
    <MockCard>
      <MockLabel>Ranked for you</MockLabel>
      {ARTISTS_MOCK.map((a, i) => (
        <div key={i}>
          <div
            className="flex items-center gap-3 py-3"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}
          >
            <img src={a.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            <div>
              <div style={{ fontSize: "18px" }}>{a.name}</div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10px",
                  color: "var(--dim)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                {a.styles}
              </div>
            </div>
            <div
              className="ml-auto"
              style={{ fontFamily: "var(--mono)", fontSize: "15px", color: TEAL }}
            >
              {[96, 91, 84][i]}%
            </div>
          </div>
          {i === 0 && (
            <div
              className="mt-2.5 mb-1 h-1 overflow-hidden rounded-sm"
              style={{ background: "var(--surface-3)" }}
            >
              <div
                className="h-full w-[96%] rounded-sm"
                style={{ background: `linear-gradient(90deg, var(--accent), ${TEAL})` }}
              />
            </div>
          )}
        </div>
      ))}
    </MockCard>
  );
}

function HowMockBook() {
  return (
    <MockCard>
      <MockLabel>Luna Vargas · @luna.ink</MockLabel>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: TEAL,
            }}
          >
            ● Now
          </div>
          <div style={{ fontSize: "20px", marginTop: 4 }}>Santa Teresa</div>
        </div>
        <div style={{ color: "var(--faint)" }}>
          <ArrowRight size={18} />
        </div>
        <div className="flex-1">
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            Next
          </div>
          <div style={{ fontSize: "20px", marginTop: 4 }}>Tamarindo</div>
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        {[true, true, false, false, false].map((on, i) => (
          <div
            key={i}
            className="h-[5px] flex-1 rounded-full"
            style={{
              background: on ? TEAL : "var(--surface-3)",
              boxShadow: on ? `0 0 10px ${TEAL_GLOW}` : "none",
            }}
          />
        ))}
      </div>
      <div className="mt-5">
        <MockGoBtn>Request a session</MockGoBtn>
      </div>
    </MockCard>
  );
}

// ── How it works — pinned scrub ───────────────────────────────────────────────

function HowSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const railScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveStep(Math.min(2, Math.floor(v * 3)));
  });

  const mocks = [<HowMockSearch key="s" />, <HowMockMatch key="m" />, <HowMockBook key="b" />];

  return (
    <section className="relative h-[calc(210vh)] lg:ml-[30px]" ref={sectionRef} id="how">
      <div
        className="lp-how-inner sticky top-0 overflow-hidden"
        style={{ height: "100vh", padding: "0 40px" }}
      >
        {/* Step counter */}
        <div
          className="lp-how-count absolute top-10 right-10 flex gap-2.5"
          style={{
            fontFamily: "var(--mono)",
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "var(--faint)",
          }}
        >
          <span>STEP</span>
          <span>
            <AnimatePresence mode="wait">
              <motion.b
                key={activeStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: E_OUT }}
                className="inline-block font-medium"
                style={{ color: "var(--text)" }}
              >
                0{activeStep + 1}
              </motion.b>
            </AnimatePresence>
            {" / 03"}
          </span>
        </div>

        <div
          className="lp-how-grid grid h-full items-center gap-2"
          style={{ gridTemplateColumns: "1fr 1fr" }}
        >
          {/* Left: text */}
          <div className="relative">
            {/* Progress rail */}
            <div
              className="absolute top-2 bottom-2 -left-6 w-[2px] overflow-hidden rounded-sm"
              style={{ background: "var(--hairline)" }}
            >
              <motion.div
                className="absolute inset-x-0 top-0 h-full origin-top"
                style={{
                  background: `linear-gradient(180deg, var(--accent), ${TEAL})`,
                  scaleY: railScaleY,
                }}
              />
            </div>

            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--dim)",
                marginBottom: 36,
              }}
            >
              How InkSpot works
            </div>

            <div className="lp-step-min relative" style={{ minHeight: 280 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -22 }}
                  transition={{ duration: 0.5, ease: E_OUT }}
                >
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "13px",
                      letterSpacing: "0.2em",
                      color: TEAL,
                      marginBottom: 18,
                      textTransform: "uppercase",
                    }}
                  >
                    <b style={{ color: "var(--faint)", fontWeight: 400 }}>0{activeStep + 1}</b> / 03
                    &nbsp; {HOW_STEPS[activeStep].k}
                  </div>
                  <h3
                    className="lp-step-h3 font-medium"
                    style={{
                      fontSize: "clamp(36px, 4.6vw, 68px)",
                      lineHeight: 0.98,
                      letterSpacing: "-0.02em",
                      margin: "0 0 20px",
                    }}
                  >
                    {HOW_STEPS[activeStep].h}
                  </h3>
                  <p
                    style={{
                      fontSize: "clamp(15px, 1.4vw, 18px)",
                      lineHeight: 1.55,
                      color: "var(--text-2)",
                      maxWidth: "38ch",
                    }}
                  >
                    {HOW_STEPS[activeStep].p}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: visual mock */}
          <div className="lp-how-visual relative flex h-full w-full items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 1.04, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -14 }}
                transition={{ duration: 0.55, ease: E_OUT }}
                className="flex w-full items-center justify-center"
              >
                {mocks[activeStep]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── AI Showcase ───────────────────────────────────────────────────────────────

function ShowcaseSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      id="showcase"
      className="lp-showcase relative flex flex-col items-center text-center"
      style={{ padding: "140px 40px" }}
    >
      {/* Eyebrow */}
      <motion.div
        className="inline-flex items-center gap-[9px]"
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: TEAL,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: E_OUT }}
      >
        <span
          className="block h-[6px] w-[6px] rounded-full"
          style={{ background: TEAL, boxShadow: `0 0 10px ${TEAL_GLOW}` }}
        />
        The search moment
      </motion.div>

      {/* Heading */}
      <motion.h2
        className="font-medium"
        style={{
          fontSize: "clamp(34px, 5vw, 76px)",
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          margin: "22px 0 0",
          maxWidth: "18ch",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease: E_OUT }}
      >
        It reads the work, then{" "}
        <em
          style={{
            fontStyle: "normal",
            background: `linear-gradient(100deg, var(--accent), ${TEAL})`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          finds your match.
        </em>
      </motion.h2>

      {/* Sub */}
      <motion.p
        className="mt-5"
        style={{
          maxWidth: "50ch",
          color: "var(--text-2)",
          fontSize: "clamp(15px, 1.4vw, 18px)",
          lineHeight: 1.55,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: E_OUT }}
      >
        Style similarity from the pixels up, ranked against who&apos;s near you — answered in plain
        language, with the artists to back it.
      </motion.p>

      {/* Stage */}
      <div className="mt-16 flex w-full flex-col gap-4" style={{ maxWidth: 600 }}>
        {/* Search input */}
        <motion.div
          className="rounded-[18px] text-left"
          style={{
            padding: "20px 22px",
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            boxShadow: "0 40px 90px -36px rgba(0,0,0,0.9)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: E_OUT }}
        >
          <div
            className="mb-3"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--faint)",
            }}
          >
            You searched
          </div>
          <div
            className="overflow-hidden"
            style={{ fontSize: "clamp(20px, 2.4vw, 28px)", lineHeight: 1.4, color: "var(--text)" }}
          >
            <motion.span
              className="inline"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={isInView ? { clipPath: "inset(0 0% 0 0)" } : {}}
              transition={{ duration: 1.5, delay: 0.5, ease: "linear" }}
            >
              fine line botanical, ribcage, palm-sized
            </motion.span>
            <motion.span
              className="ml-[2px] inline-block w-[3px] align-text-bottom"
              style={{ height: "1.05em", background: TEAL, boxShadow: `0 0 10px ${TEAL_GLOW}` }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: [1, 0, 0, 1] }}
            />
          </div>
        </motion.div>

        {/* AI answer */}
        <motion.div
          className="rounded-[18px] text-left"
          style={{
            padding: "18px 22px",
            background: `linear-gradient(180deg, ${TEAL_SOFT}, transparent)`,
            border: "1px solid var(--hairline)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 2.0, ease: E_OUT }}
        >
          <div
            className="mb-2.5 flex items-center gap-[7px]"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: TEAL,
            }}
          >
            <span
              className="block h-[5px] w-[5px] rounded-full"
              style={{ background: TEAL, boxShadow: `0 0 8px ${TEAL_GLOW}` }}
            />
            InkSpot AI
          </div>
          <div
            style={{ fontSize: "clamp(16px, 1.6vw, 19px)", lineHeight: 1.45, color: "var(--text)" }}
          >
            Three artists near <span style={{ color: TEAL }}>your location</span> work in delicate
            single-needle botanicals. <span style={{ color: TEAL }}>Luna Vargas</span> is the
            closest match — and she&apos;s in town until the 22nd.
          </div>
        </motion.div>

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-3">
          {SHOWCASE_CARDS.map(({ artist, pct, style }, i) => (
            <motion.div
              key={i}
              className="rounded-2xl p-4 text-left"
              style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
              initial={{ opacity: 0, y: 22 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 2.5 + i * 0.15, ease: E_OUT }}
            >
              <img
                src={artist.portfolio0}
                alt=""
                className="aspect-square w-full rounded-[10px] object-cover"
              />
              <div className="mt-3" style={{ fontSize: "16px" }}>
                {artist.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--dim)",
                  marginTop: 3,
                }}
              >
                {style}
              </div>
              <div
                className="mt-2 flex items-center gap-1.5"
                style={{ fontFamily: "var(--mono)", fontSize: "13px", color: TEAL }}
              >
                <span className="block h-[5px] w-[5px] rounded-full" style={{ background: TEAL }} />
                {pct}% match
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer CTA ────────────────────────────────────────────────────────────────

function FooterCTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  const footLines: { text: React.ReactNode; delay: number }[] = [
    { text: "Your next", delay: 0.05 },
    {
      text: (
        <>
          piece is{" "}
          <em
            style={{
              fontStyle: "normal",
              background: `linear-gradient(100deg, var(--accent), ${TEAL})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            out there.
          </em>
        </>
      ),
      delay: 0.16,
    },
  ];

  return (
    <section
      ref={ref}
      className="lp-foot relative overflow-hidden"
      style={{ padding: "130px 40px 48px", borderTop: "1px solid var(--hairline)" }}
    >
      {/* Big headline */}
      <h2
        className="font-bold uppercase"
        style={{
          fontSize: "clamp(56px, 12vw, 200px)",
          lineHeight: 0.84,
          letterSpacing: "-0.045em",
        }}
      >
        {footLines.map(({ text, delay }, i) => (
          <span key={i} className="block overflow-hidden pb-[0.04em]">
            <motion.span
              className="block"
              initial={{ y: "112%" }}
              animate={isInView ? { y: "0%" } : {}}
              transition={{ duration: 1.05, delay, ease: E_OUT }}
            >
              {text}
            </motion.span>
          </span>
        ))}
      </h2>

      {/* CTAs */}
      <motion.div
        className="lp-foot-ctas mt-11 flex flex-col gap-4 sm:flex-row sm:flex-wrap"
        initial={{ opacity: 0, y: 26 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.4, ease: E_OUT }}
      >
        <Link
          href="/explore"
          className="lp-foot-cta inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_var(--accent-glow)] sm:justify-start"
          style={{
            fontFamily: "var(--mono)",
            background: "var(--accent)",
            boxShadow: "0 10px 40px -8px var(--accent-glow)",
          }}
        >
          Find an artist <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="lp-foot-cta inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 text-xs font-semibold tracking-[0.12em] uppercase transition-all hover:-translate-y-0.5 hover:border-[#27b7a5] hover:text-[#27b7a5] sm:justify-start"
          style={{
            fontFamily: "var(--mono)",
            color: "var(--text)",
            border: "1px solid var(--border-ds)",
          }}
        >
          Join as an artist <ArrowRight size={16} />
        </Link>
      </motion.div>

      {/* Bottom bar */}
      <div
        className="lp-foot-bottom mt-28 flex flex-wrap items-center justify-between gap-5 pt-7"
        style={{ borderTop: "1px solid var(--hairline)" }}
      >
        <Wordmark className="text-[18px]" />
        <div className="flex flex-wrap gap-[18px]">
          {[
            ["Explore", "/explore"],
            ["How it works", "#how"],
            ["For artists", "/login"],
            ["Contact", "#"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="transition-colors hover:text-white"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "10px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--dim)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--faint)",
          }}
        >
          © InkSpot 2026 · The needle travels
        </div>
      </div>
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LandingClient() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) lenisRef.current?.scrollTo(el, { offset: -20 });
  };

  return (
    <>
      {/* Global keyframes + mobile overrides */}
      <style>{`
        @keyframes lp-blink { 50% { opacity: 0; } }

        @media (min-width: 1440px) {
          .lp-float-0 { width: clamp(172px, 13vw, 300px) !important; height: clamp(228px, 17vw, 400px) !important; }
          .lp-float-1 { width: clamp(144px, 11vw, 240px) !important; height: clamp(190px, 14vw, 310px) !important; }
          .lp-float-2 { width: clamp(168px, 12vw, 280px) !important; height: clamp(222px, 16vw, 370px) !important; }
          .lp-float-3 { width: clamp(138px, 10vw, 220px) !important; height: clamp(182px, 13vw, 290px) !important; }
        }

        @media (max-width: 639px) {
          /* Nav */
          .lp-nav        { padding: 0 20px !important; }

          /* Hero */
          .lp-hero       { padding: 24px 20px 90px !important; }
          .lp-headline   { max-width: 100% !important; font-size: 60px !important; line-height: 0.88 !important; }

          /* Hide all float images — they overlap content on small screens */
          .lp-float-0,
          .lp-float-1,
          .lp-float-2,
          .lp-float-3    { display: none !important; }

          /* Scroll cue */
          .lp-scroll-cue { left: 20px !important; }

          /* Marquee */
          .lp-marquee-item { font-size: 20px !important; padding: 0 14px !important; gap: 14px !important; }

          /* CTA buttons — match app design-system h-[46px] on mobile */
          .lp-cta-btn    { height: 46px !important; }

          /* How section */
          .lp-how-inner  { padding: 0 20px !important; }
          .lp-how-grid   { grid-template-columns: 1fr !important; align-content: start !important; padding-top: 60px; gap: 24px !important; }
          .lp-how-visual { min-height: 220px !important; height: auto !important; }
          .lp-step-min   { min-height: 160px !important; }
          .lp-step-h3    { font-size: 34px !important; }
          .lp-how-count  { top: 16px !important; right: 20px !important; }

          /* Showcase */
          .lp-showcase   { padding: 70px 20px !important; }

          /* Footer */
          .lp-foot       { padding: 60px 20px 32px !important; }
          .lp-foot-ctas  { flex-direction: column !important; margin-top: 28px !important; }
          .lp-foot-cta   { width: 100% !important; justify-content: center !important; height: 46px !important; }
          .lp-foot-bottom { flex-direction: column !important; align-items: flex-start !important; margin-top: 52px !important; gap: 14px !important; }
        }
      `}</style>

      <div className="relative" style={{ background: "#050505", color: "var(--text)" }}>
        {/* Film grain */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            zIndex: 40,
            opacity: 0.05,
            mixBlendMode: "overlay",
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")`,
          }}
        />

        {/* Ambient gradient glows */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{
            zIndex: 0,
            opacity: 0.28,
            background: `
              radial-gradient(60% 50% at 12% 6%, rgba(100, 103, 242, 0.45), transparent 60%),
              radial-gradient(55% 45% at 92% 96%, rgba(39, 183, 165, 0.42), transparent 62%)
            `,
          }}
        />

        <div className="relative" style={{ zIndex: 1 }}>
          <LandingNav scrollTo={scrollTo} />
          <HeroSection />
          <MarqueeSection />
          <HowSection />
          <ShowcaseSection />
          <FooterCTA />
        </div>
      </div>
    </>
  );
}
