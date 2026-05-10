import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ScanSearch,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Globe,
  AtSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "InkSpot — Find tattoo artists by style",
  description:
    "Find tattoo artists who match your aesthetic — by image, by feel, by voice. Verified studios in Costa Rica.",
};

const problems = [
  {
    label: "Google Maps",
    issue:
      "Shows you whoever's nearby. No style search, no portfolio, no way to know if their work matches yours.",
  },
  {
    label: "Instagram",
    issue:
      "Great for inspiration, useless for discovery. No search by style. Portfolios scattered across thousands of posts.",
  },
  {
    label: "Word of mouth",
    issue: "Works if you know the right people. Everyone else starts from scratch every time.",
  },
];

const steps = [
  {
    n: "01",
    title: "Search by style",
    body: "Upload a reference image, describe in text, or use your voice. Tell us what you're after.",
  },
  {
    n: "02",
    title: "AI matches your aesthetic",
    body: "We compare your vision against every artist's portfolio — not just keywords or location.",
  },
  {
    n: "03",
    title: "Contact directly",
    body: "Reach out on Instagram or by email. No middleman, no booking fees.",
  },
];

const aiFeatures = [
  {
    icon: ScanSearch,
    title: "Visual style matching",
    body: "Upload any image — tattoo, illustration, photo — and find artists whose work looks and feels similar.",
  },
  {
    icon: Sparkles,
    title: "AI artist summaries",
    body: "Every claimed profile has an AI-written summary of the artist's signature style, generated from their portfolio.",
  },
  {
    icon: MessageSquare,
    title: "Ask anything",
    body: "Chat with a profile. Ask about booking, pricing, style history. Answers are grounded in real portfolio data.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="border-border/50 bg-background/80 fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b px-5 backdrop-blur-md">
        <span className="text-sm font-medium tracking-tight">InkSpot</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/login">I&apos;m a tattoo artist</Link>
        </Button>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative flex min-h-svh items-end overflow-hidden pt-14">
        {/* Moody background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(99,102,241,0.12) 0%, transparent 60%), #0a0a0a",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto w-full max-w-2xl px-5 pt-24 pb-20 sm:pb-28">
          <p className="text-muted-foreground mb-5 text-xs font-medium tracking-[0.14em] uppercase">
            Tattoo artist directory · Costa Rica
          </p>
          <h1 className="text-foreground text-[2.6rem] leading-[1.08] font-medium tracking-[-0.04em] sm:text-6xl">
            Find your next tattoo by <em className="text-primary not-italic">style</em>,<br />
            not just location.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-sm text-base leading-relaxed">
            Upload a reference image, describe your vision, or use your voice. InkSpot matches you
            with artists whose work fits your aesthetic — wherever they are.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 text-white" asChild>
              <Link href="/explore">
                Explore artists
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/60 text-foreground hover:border-border"
              asChild
            >
              <Link href="/login">
                <AtSign className="text-muted-foreground size-4" aria-hidden />
                I&apos;m a tattoo artist
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Problem ─────────────────────────────────────── */}
      <section className="border-border border-t px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
            The problem
          </p>
          <h2 className="mb-10 text-2xl font-medium tracking-tight">
            Finding a tattoo artist is still broken.
          </h2>
          <div className="border-border bg-border grid gap-px overflow-hidden rounded-xl border">
            {problems.map(({ label, issue }) => (
              <div key={label} className="bg-card flex gap-5 px-5 py-5">
                <span className="text-muted-foreground/60 mt-0.5 w-20 shrink-0 text-xs font-medium">
                  {label}
                </span>
                <p className="text-muted-foreground text-sm leading-relaxed">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="border-border border-t px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
            How it works
          </p>
          <h2 className="mb-12 text-2xl font-medium tracking-tight">
            From idea to artist in three steps.
          </h2>
          <div className="border-border bg-border space-y-px overflow-hidden rounded-xl border">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="bg-card flex gap-6 px-5 py-6">
                <span className="text-primary/60 shrink-0 pt-0.5 text-xs font-medium tabular-nums">
                  {n}
                </span>
                <div>
                  <p className="text-foreground text-sm font-medium">{title}</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI features ─────────────────────────────────── */}
      <section className="border-border border-t px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.12em] uppercase">
              AI features
            </p>
            <span className="badge-ai">AI</span>
          </div>
          <h2 className="mb-12 text-2xl font-medium tracking-tight">
            Smarter than a search engine.
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {aiFeatures.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="border-border bg-card space-y-3 rounded-xl border px-5 py-5"
              >
                <div className="bg-ai-subtle border-ai/20 flex size-9 items-center justify-center rounded-lg border">
                  <Icon className="text-ai size-4" aria-hidden />
                </div>
                <p className="text-foreground text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For artists ─────────────────────────────────── */}
      <section className="border-border border-t px-5 py-20">
        <div className="mx-auto max-w-2xl">
          <div className="border-border bg-card rounded-xl border px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-[0.12em] uppercase">
              For artists
            </p>
            <h2 className="mb-3 text-2xl font-medium tracking-tight">
              Your portfolio, automatically.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
              Connect Instagram in 30 seconds. We generate your profile from existing posts — styles
              detected, bio written, portfolio organized. No forms, no uploads, no friction.
            </p>
            <div className="mb-8 space-y-3">
              {[
                "AI detects your styles from portfolio images",
                "Bio and summary generated automatically",
                "Clients find you by what your work actually looks like",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/login">
                <AtSign className="size-4" aria-hidden />
                Connect Instagram
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-border border-t px-5 py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium">InkSpot</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Tattoo artist directory · Santa Teresa, Costa Rica
            </p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Explore
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              Search
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Artists
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <button className="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <Globe className="size-3" aria-hidden />
              <span>ES</span>
            </button>
          </div>
        </div>
        <div className="border-border text-muted-foreground/50 mx-auto mt-8 max-w-2xl border-t pt-6 text-xs">
          Demo profiles are fictional. Photos from Unsplash. InkSpot is not affiliated with
          Instagram or Meta.
        </div>
      </footer>
    </div>
  );
}
