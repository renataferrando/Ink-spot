"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";
import Lenis from "lenis";
import {
  E_OUT,
  ARTISTS_MOCK,
  SHOWCASE_CARDS,
  FLOATS,
  ROTOR_WORDS,
  MARQUEE,
  HOW_STEPS,
} from "@/lib/landing/constants";

// ── Parallax image ──────────────────────────────────────────────────────────

function ParallaxImg({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["18%", "-18%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* scale stays in style: paired with motion value y on a motion element */}
      <motion.div className="relative h-full w-full" style={{ y, scale: 1.38 }}>
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 200px" className="object-cover" />
      </motion.div>
    </div>
  );
}

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
      <i className="bg-ink-spot block h-[7px] w-[7px] shrink-0 rounded-full not-italic shadow-[0_0_12px_var(--accent-glow)]" />
    </Link>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav({ scrollTo }: { scrollTo: (id: string) => void }) {
  return (
    <header className="lp-nav sticky top-0 z-30 flex h-[70px] items-center justify-between bg-[linear-gradient(180deg,rgba(5,5,5,0.86)_0%,rgba(5,5,5,0)_100%)] px-10 backdrop-blur-[4px]">
      <Wordmark className="text-[22px]" />

      <nav className="hidden gap-1 sm:flex">
        {[
          { label: "How it works", id: "how" },
          { label: "The match", id: "showcase" },
        ].map(({ label, id }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className="text-text-2 cursor-pointer rounded-full px-[14px] py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white/5 hover:text-white"
          >
            {label}
          </button>
        ))}
        <Link
          href="/login"
          className="text-text-2 rounded-full px-[14px] py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors hover:bg-white/5 hover:text-white"
        >
          For artists
        </Link>
      </nav>

      <Link
        href="/explore"
        className="inline-flex h-[38px] items-center gap-2 rounded-full bg-[var(--text)] px-[18px] font-mono text-[11px] font-semibold tracking-[0.12em] text-[#050505] uppercase transition-all hover:-translate-y-px hover:shadow-[0_8px_30px_rgba(255,255,255,0.18)]"
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
    <div className="mt-7 flex items-center gap-3 font-mono text-[clamp(14px,1.4vw,19px)] tracking-[0.08em] uppercase">
      <span className="text-text-2 whitespace-nowrap">matched for</span>
      <div className="relative h-[1.5em] min-w-[13.5ch] overflow-hidden leading-[1.5em] text-[#27b7a5]">
        <AnimatePresence mode="wait">
          <motion.b
            key={ROTOR_WORDS[idx]}
            initial={{ y: "70%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-70%", opacity: 0 }}
            transition={{ duration: 0.55, ease: E_OUT }}
            className="absolute top-0 left-0 leading-[1.5em] font-semibold"
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
  rotate = 0,
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
  rotate?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { scrollYProgress: innerProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollY, [0, 1000], [0, -(speed * 0.08)]);
  const innerY = useTransform(innerProgress, [0, 1], ["12%", "-12%"]);

  return (
    <motion.div
      ref={containerRef}
      className={`lp-float-${floatIdx} border-hairline absolute z-0 overflow-hidden rounded-2xl border shadow-[0_40px_80px_-24px_rgba(0,0,0,0.85)] brightness-[0.82] contrast-[1.06] grayscale`}
      style={{ width: w, height: h, top, bottom, right, y, rotate }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay, ease: E_OUT }}
    >
      {/* Duotone tint */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(150deg,var(--accent)_0%,transparent_55%),rgba(39,183,165,0.12)] opacity-70 mix-blend-soft-light" />
      {/* Scrim */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,transparent_45%,rgba(5,5,5,0.75))]" />
      {/* Inner parallax layer — scale paired with motion value, stays in style */}
      <motion.div className="relative h-full w-full" style={{ y: innerY, scale: 1.38 }}>
        <motion.div
          className="relative h-full w-full"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: bob }}
        >
          <Image src={src} alt="" fill sizes="280px" className="object-cover" />
        </motion.div>
      </motion.div>
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
        <em className="bg-[linear-gradient(100deg,var(--accent),#27b7a5)] bg-clip-text text-transparent not-italic">
          artist
        </em>
      ),
      delay: 0.23,
    },
  ];

  const isDesktop = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 640px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => false,
  );

  return (
    <section className="lp-hero relative flex min-h-screen flex-col justify-center overflow-hidden px-10 pt-20 pb-[150px]">
      {/* Kicker */}
      <motion.div
        className="text-text-2 mb-7 flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: E_OUT }}
      >
        <span className="bg-ink-spot h-px w-7 shrink-0 shadow-[0_0_10px_var(--accent-glow)]" />
        Style-matched · Geolocated · Wherever you are
      </motion.div>

      {/* Headline */}
      <h1 className="lp-headline max-w-[min(52%,680px)] text-[clamp(48px,7.8vw,138px)] leading-[0.86] font-bold tracking-[-0.04em] uppercase">
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
        className="text-text-2 mt-9 max-w-[46ch] text-[clamp(15px,1.5vw,19px)] leading-[1.55]"
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
          className="lp-cta-btn bg-ink-spot inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 font-mono text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-[0_10px_40px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_var(--accent-glow)] sm:justify-start"
        >
          Find an artist <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="lp-cta-btn border-ds-border inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full border px-7 font-mono text-xs font-semibold tracking-[0.12em] text-(--text) uppercase transition-all hover:-translate-y-0.5 hover:border-[#27b7a5] hover:text-[#27b7a5] sm:justify-start"
        >
          Join as an artist
        </Link>
      </motion.div>

      {/* Floating images (desktop only) */}
      {isDesktop && FLOATS.map((f, i) => (
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
          rotate={f.rotate}
        />
      ))}

      {/* Scroll cue */}
      <div className="lp-scroll-cue text-faint absolute bottom-9 left-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.22em] uppercase">
        <div className="bg-ds-border relative h-10 w-px overflow-hidden">
          <motion.div
            className="absolute left-0 h-[40%] w-px bg-[#27b7a5] shadow-[0_0_8px_rgba(39,183,165,0.42)]"
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
    <div className="border-hairline overflow-hidden border-y [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)] py-6">
      <motion.div
        className="inline-flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        {items.map((s, i) => (
          <span
            key={i}
            className={`lp-marquee-item inline-flex items-center gap-[26px] px-[26px] text-[30px] tracking-[-0.01em] ${i % 3 === 1 ? "text-faint" : "text-(--text)"}`}
          >
            {s}
            <span className="block h-[7px] w-[7px] shrink-0 rounded-full bg-[#27b7a5] shadow-[0_0_10px_rgba(39,183,165,0.42)]" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── How it works — mock UIs ───────────────────────────────────────────────────

function MockCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border-hairline w-full max-w-[620px] rounded-[20px] border p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
      {children}
    </div>
  );
}

function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-faint mb-4 font-mono text-[10px] tracking-[0.16em] uppercase">
      {children}
    </div>
  );
}

function MockGoBtn({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink-spot inline-flex h-[38px] items-center gap-[6px] rounded-full px-4 font-mono text-[11px] tracking-[0.12em] text-white uppercase">
      {children}
    </div>
  );
}

function HowMockSearch() {
  return (
    <MockCard>
      <MockLabel>New search</MockLabel>
      <div className="text-[22px] leading-[1.3] text-(--text)">
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
            className="border-hairline bg-surface-2 text-dim flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border"
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
            className={`flex items-center gap-3 py-3 ${i !== 0 ? "border-hairline border-t" : ""}`}
          >
            <Image src={a.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full object-cover" />
            <div>
              <div className="text-[18px]">{a.name}</div>
              <div className="text-dim mt-[2px] font-mono text-[10px] tracking-[0.06em] uppercase">
                {a.styles}
              </div>
            </div>
            <div className="ml-auto font-mono text-[15px] text-[#27b7a5]">{[96, 91, 84][i]}%</div>
          </div>
          {i === 0 && (
            <div className="bg-surface-3 mt-2.5 mb-1 h-1 overflow-hidden rounded-sm">
              <div className="h-full w-[96%] rounded-sm bg-[linear-gradient(90deg,var(--accent),#27b7a5)]" />
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
          <div className="font-mono text-[9px] tracking-[0.14em] text-[#27b7a5] uppercase">
            ● Now
          </div>
          <div className="mt-1 text-[20px]">Santa Teresa</div>
        </div>
        <div className="text-faint">
          <ArrowRight size={18} />
        </div>
        <div className="flex-1">
          <div className="text-faint font-mono text-[9px] tracking-[0.14em] uppercase">Next</div>
          <div className="mt-1 text-[20px]">Tamarindo</div>
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        {[true, true, false, false, false].map((on, i) => (
          <div
            key={i}
            className={`h-[5px] flex-1 rounded-full ${on ? "bg-[#27b7a5] shadow-[0_0_10px_rgba(39,183,165,0.42)]" : "bg-surface-3"}`}
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
      <div className="lp-how-inner sticky top-0 h-screen overflow-hidden px-10">
        {/* Step counter */}
        <div className="lp-how-count text-faint absolute top-10 right-10 flex gap-2.5 font-mono text-[11px] tracking-[0.2em]">
          <span>STEP</span>
          <span>
            <AnimatePresence mode="wait">
              <motion.b
                key={activeStep}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: E_OUT }}
                className="inline-block font-medium text-(--text)"
              >
                0{activeStep + 1}
              </motion.b>
            </AnimatePresence>
            {" / 03"}
          </span>
        </div>

        <div className="lp-how-grid grid h-full grid-cols-2 items-center gap-2">
          {/* Left: text */}
          <div className="relative">
            {/* Progress rail */}
            <div className="bg-hairline absolute top-2 bottom-2 -left-6 w-[2px] overflow-hidden rounded-sm">
              <motion.div
                className="absolute inset-x-0 top-0 h-full origin-top bg-[linear-gradient(180deg,var(--accent),#27b7a5)]"
                style={{ scaleY: railScaleY }}
              />
            </div>

            <div className="text-dim mb-9 font-mono text-[11px] tracking-[0.2em] uppercase">
              How InkSpot works
            </div>

            <div className="lp-step-min relative min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -22 }}
                  transition={{ duration: 0.5, ease: E_OUT }}
                >
                  <div className="mb-[18px] font-mono text-[13px] tracking-[0.2em] text-[#27b7a5] uppercase">
                    <b className="text-faint font-normal">0{activeStep + 1}</b> / 03 &nbsp;{" "}
                    {HOW_STEPS[activeStep].k}
                  </div>
                  <h3 className="lp-step-h3 mb-5 text-[clamp(36px,4.6vw,68px)] leading-[0.98] font-medium tracking-[-0.02em]">
                    {HOW_STEPS[activeStep].h}
                  </h3>
                  <p className="text-text-2 max-w-[38ch] text-[clamp(15px,1.4vw,18px)] leading-[1.55]">
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
      className="lp-showcase relative flex flex-col items-center px-10 py-[140px] text-center"
    >
      {/* Eyebrow */}
      <motion.div
        className="inline-flex items-center gap-[9px] font-mono text-[11px] tracking-[0.2em] text-[#27b7a5] uppercase"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: E_OUT }}
      >
        <span className="block h-[6px] w-[6px] rounded-full bg-[#27b7a5] shadow-[0_0_10px_rgba(39,183,165,0.42)]" />
        The search moment
      </motion.div>

      {/* Heading */}
      <motion.h2
        className="mt-[22px] max-w-[18ch] text-[clamp(34px,5vw,76px)] leading-none font-medium tracking-[-0.02em]"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease: E_OUT }}
      >
        It reads the work, then{" "}
        <em className="bg-[linear-gradient(100deg,var(--accent),#27b7a5)] bg-clip-text text-transparent not-italic">
          finds your match.
        </em>
      </motion.h2>

      {/* Sub */}
      <motion.p
        className="text-text-2 mt-5 max-w-[50ch] text-[clamp(15px,1.4vw,18px)] leading-[1.55]"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: E_OUT }}
      >
        Style similarity from the pixels up, ranked against who&apos;s near you — answered in plain
        language, with the artists to back it.
      </motion.p>

      {/* Stage */}
      <div className="mt-16 flex w-full max-w-[600px] flex-col gap-4">
        {/* Search input */}
        <motion.div
          className="bg-surface border-hairline rounded-[18px] border px-[22px] py-5 text-left shadow-[0_40px_90px_-36px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3, ease: E_OUT }}
        >
          <div className="text-faint mb-3 font-mono text-[10px] tracking-[0.16em] uppercase">
            You searched
          </div>
          <div className="overflow-hidden text-[clamp(20px,2.4vw,28px)] leading-[1.4] text-(--text)">
            <motion.span
              className="inline"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={isInView ? { clipPath: "inset(0 0% 0 0)" } : {}}
              transition={{ duration: 1.5, delay: 0.5, ease: "linear" }}
            >
              fine line botanical, ribcage, palm-sized
            </motion.span>
            <motion.span
              className="ml-[2px] inline-block h-[1.05em] w-[3px] bg-[#27b7a5] align-text-bottom shadow-[0_0_10px_rgba(39,183,165,0.42)]"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: [1, 0, 0, 1] }}
            />
          </div>
        </motion.div>

        {/* AI answer */}
        <motion.div
          className="border-hairline rounded-[18px] border bg-[linear-gradient(180deg,rgba(39,183,165,0.12),transparent)] px-[22px] py-[18px] text-left"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 2.0, ease: E_OUT }}
        >
          <div className="mb-2.5 flex items-center gap-[7px] font-mono text-[10px] tracking-[0.16em] text-[#27b7a5] uppercase">
            <span className="block h-[5px] w-[5px] rounded-full bg-[#27b7a5] shadow-[0_0_8px_rgba(39,183,165,0.42)]" />
            InkSpot AI
          </div>
          <div className="text-[clamp(16px,1.6vw,19px)] leading-[1.45] text-(--text)">
            Three artists near <span className="text-[#27b7a5]">your location</span> work in
            delicate single-needle botanicals. <span className="text-[#27b7a5]">Luna Vargas</span>{" "}
            is the closest match — and she&apos;s in town until the 22nd.
          </div>
        </motion.div>

        {/* Result cards */}
        <div className="grid grid-cols-3 gap-3">
          {SHOWCASE_CARDS.map(({ artist, pct, style }, i) => (
            <motion.div
              key={i}
              className="bg-surface border-hairline rounded-2xl border p-4 text-left"
              initial={{ opacity: 0, y: 22 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 2.5 + i * 0.15, ease: E_OUT }}
            >
              <ParallaxImg
                src={artist.portfolio0}
                className="aspect-square w-full rounded-[10px]"
              />
              <div className="mt-3 text-[16px]">{artist.name}</div>
              <div className="text-dim mt-[3px] font-mono text-[9px] tracking-[0.08em] uppercase">
                {style}
              </div>
              <div className="mt-2 flex items-center gap-1.5 font-mono text-[13px] text-[#27b7a5]">
                <span className="block h-[5px] w-[5px] rounded-full bg-[#27b7a5]" />
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
          <em className="bg-[linear-gradient(100deg,var(--accent),#27b7a5)] bg-clip-text text-transparent not-italic">
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
      className="lp-foot border-hairline relative overflow-hidden border-t px-10 pt-[130px] pb-12"
    >
      {/* Big headline */}
      <h2 className="text-[clamp(56px,12vw,200px)] leading-[0.84] font-bold tracking-[-0.045em] uppercase">
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
          className="lp-foot-cta bg-ink-spot inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full px-7 font-mono text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-[0_10px_40px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-8px_var(--accent-glow)] sm:justify-start"
        >
          Find an artist <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="lp-foot-cta border-ds-border inline-flex h-[54px] items-center justify-center gap-[10px] rounded-full border px-7 font-mono text-xs font-semibold tracking-[0.12em] text-(--text) uppercase transition-all hover:-translate-y-0.5 hover:border-[#27b7a5] hover:text-[#27b7a5] sm:justify-start"
        >
          Join as an artist <ArrowRight size={16} />
        </Link>
      </motion.div>

      {/* Bottom bar */}
      <div className="lp-foot-bottom border-hairline mt-28 flex flex-wrap items-center justify-between gap-5 border-t pt-7">
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
              className="text-dim font-mono text-[10px] tracking-[0.14em] uppercase transition-colors hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="text-faint font-mono text-[10px] tracking-[0.14em] uppercase">
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
    <div className="relative bg-[#050505] text-(--text)">
      {/* Ambient gradient glows */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(60%_50%_at_12%_6%,rgba(100,103,242,0.45),transparent_60%),radial-gradient(55%_45%_at_92%_96%,rgba(39,183,165,0.42),transparent_62%)] opacity-[0.28]" />

      <div className="relative z-[1]">
        <LandingNav scrollTo={scrollTo} />
        <HeroSection />
        <MarqueeSection />
        <HowSection />
        <ShowcaseSection />
        <FooterCTA />
      </div>
    </div>
  );
}
