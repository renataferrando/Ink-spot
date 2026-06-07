"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart2,
  MessageSquare,
  Grid2x2,
  User,
  ArrowRight,
  Calendar,
  Camera,
  Plus,
  Inbox,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth/sign-out";
import { DashboardAvatar } from "./dashboard-avatar";

// ── Public types ──────────────────────────────────────────────────────────────
export interface DashboardData {
  displayName: string;
  handle: string;
  bio: string | null;
  profileImageUrl: string | null;
  isActive: boolean;
  isClaimed: boolean;
  hasInstagram: boolean;
  currentLocation: { location_name: string } | null;
  nextLocation: { location_name: string; starts_at: string | null } | null;
  portfolioItems: { id: string; image_url: string }[];
  profileStrength: number;
}

type Tab = "home" | "inquiries" | "portfolio" | "preview";

// ── Shared atoms ──────────────────────────────────────────────────────────────

const AccentDot = ({ size = 5 }: { size?: number }) => (
  <span
    className="inline-block shrink-0 rounded-full bg-ink-spot"
    style={{ width: size, height: size, boxShadow: "0 0 8px var(--accent-glow)" }}
  />
);

function Spark({ data }: { data: number[] }) {
  const w = 60, h = 22;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 3) - 1.5}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatCell({ label, value, delta, data, large }: {
  label: string; value: string; delta: number; data: number[]; large?: boolean;
}) {
  return (
    <div className="bg-surface border-hairline rounded-[14px] border p-[14px] lg:p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-dim font-mono text-[9px] tracking-[0.12em] uppercase">{label}</span>
        <Spark data={data} />
      </div>
      <div className={cn("mt-3 font-medium leading-none tracking-tight", large ? "text-[34px]" : "text-[30px]")}>
        {value}
      </div>
      <div className={cn("mt-1.5 font-mono text-[10px] leading-none", delta >= 0 ? "text-[#3ddc84]" : "text-[#ff5d5d]")}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% this week
      </div>
    </div>
  );
}

// ── Location widget (shared, used in both mobile home and desktop card) ───────
function LocationWidget({ data }: { data: DashboardData }) {
  const nextDate = data.nextLocation?.starts_at
    ? new Date(data.nextLocation.starts_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  return (
    <div className="bg-surface border-hairline flex items-center gap-3.5 rounded-[14px] border px-4 py-[14px]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase text-faint">
          <AccentDot size={6} /> Now
        </div>
        <div className="mt-0.5 truncate text-[18px] font-medium leading-[1.2]">
          {data.currentLocation?.location_name?.split(",")[0] ?? "—"}
        </div>
      </div>
      <ArrowRight size={14} className="text-faint shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-faint">Next</div>
        <div className="text-text-2 mt-0.5 truncate text-[18px] font-medium leading-[1.2]">
          {data.nextLocation?.location_name?.split(",")[0] ?? "—"}
        </div>
        {nextDate && <div className="text-dim mt-0.5 font-mono text-[10px]">from {nextDate}</div>}
      </div>
    </div>
  );
}

// ── AI panel (shared coming-soon state) ───────────────────────────────────────
function AiPanel({ flush }: { flush?: boolean }) {
  return (
    <div
      className={cn("border-hairline rounded-[18px] border p-[18px]", flush && "rounded-none border-0 border-b")}
      style={{ background: "linear-gradient(180deg, var(--accent-soft) 0%, transparent 72%)" }}
    >
      <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-ink-spot">
        <AccentDot size={5} />
        AI Search · this week
      </div>
      <div className="py-5 text-center">
        <p className="text-text-2 text-[14px]">Appears once clients start searching</p>
        <p className="text-faint mt-1 font-mono text-[10px] tracking-[0.08em] uppercase">Coming soon</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

function MobileHomeTab({ data }: { data: DashboardData }) {
  const firstName = data.displayName.split(" ")[0];
  const flat = [0, 0, 0, 0, 0, 0, 0];
  const initials = data.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between gap-4 px-[18px] pb-4 pt-5">
        <div>
          <div className="text-[28px] font-medium leading-none tracking-tight">
            Hola, <span className="text-ink-spot">{firstName}</span>
          </div>
          <div className="text-dim mt-[9px] font-mono text-[10px] tracking-[0.14em] uppercase">
            Here&rsquo;s your week on InkSpot
          </div>
        </div>
        <DashboardAvatar src={data.profileImageUrl} initials={initials} size="sm" />
      </div>

      {/* Status card */}
      <div className="bg-surface border-hairline mx-[18px] mb-4 rounded-[16px] border p-[18px]">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          <span className="size-[7px] shrink-0 rounded-full" style={{ background: data.isActive ? "#3ddc84" : "var(--dim)", boxShadow: data.isActive ? "0 0 10px rgba(61,220,132,0.6)" : "none" }} />
          {data.isActive ? "Live & visible" : "Profile hidden"}
        </div>
        {data.currentLocation && (
          <div className="text-text-2 mt-[9px] text-[13px]">{data.currentLocation.location_name}</div>
        )}
        {!data.isClaimed && (
          <div className="mt-2 inline-block rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase text-demo">
            Verification pending
          </div>
        )}
        <div className="mt-[14px] flex items-center gap-[10px]">
          <div className="h-1 flex-1 overflow-hidden rounded-[2px] bg-surface-3">
            <div className="h-full rounded-[2px] bg-ink-spot" style={{ width: `${data.profileStrength}%`, boxShadow: "0 0 8px var(--accent-glow)" }} />
          </div>
          <span className="text-dim font-mono text-[10px] tracking-[0.08em] uppercase shrink-0">Profile {data.profileStrength}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[10px] px-[18px] pb-[6px]">
        <StatCell label="Profile views" value="—" delta={0} data={flat} />
        <StatCell label="Search hits"   value="—" delta={0} data={flat} />
        <StatCell label="Shortlisted"   value="—" delta={0} data={flat} />
        <StatCell label="Inquiries"     value="—" delta={0} data={flat} />
      </div>
      <p className="px-[18px] pb-1 text-faint font-mono text-[9px] tracking-widest uppercase">
        Analytics activate as visitors engage
      </p>

      <div className="mx-[18px] my-3"><AiPanel /></div>

      <div className="flex items-baseline justify-between px-[18px] pb-3 pt-[22px]">
        <div className="text-[22px] font-medium tracking-tight">Where you are</div>
      </div>
      <div className="mx-[18px]"><LocationWidget data={data} /></div>

      <Link href="/dashboard/locations" className="border-hairline mx-[18px] mt-[14px] flex h-[46px] w-[calc(100%-36px)] items-center justify-center gap-2 rounded-full border bg-surface-2 font-mono text-[11px] tracking-[0.12em] uppercase text-(--text) transition-colors hover:bg-surface-3">
        <Calendar size={14} aria-hidden /> Manage travel dates
      </Link>

      <form action={signOut} className="mx-[18px] mt-6">
        <button type="submit" className="text-faint hover:text-dim flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors">
          <LogOut size={12} aria-hidden /> Sign out
        </button>
      </form>
      <div className="h-10" />
    </div>
  );
}

function MobileInquiriesTab() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between px-[18px] pb-3 pt-[22px]">
        <div className="text-[22px] font-medium tracking-tight">Inquiries</div>
        <div className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">0 New</div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-20">
        <Inbox size={36} className="text-surface-3" aria-hidden />
        <p className="text-text-2 text-[14px]">No inquiries yet</p>
        <p className="text-faint font-mono text-[10px] tracking-widest uppercase">Client messaging coming soon</p>
      </div>
    </div>
  );
}

function MobilePortfolioTab({ items, handle }: { items: DashboardData["portfolioItems"]; handle: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-baseline justify-between px-[18px] pb-3 pt-[22px]">
        <div className="text-[22px] font-medium tracking-tight">Portfolio</div>
        <div className="text-dim font-mono text-[10px] tracking-[0.12em] uppercase">{items.length} Photos</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-[18px]">
        {items.map((item) => (
          <div key={item.id} className="aspect-square overflow-hidden rounded-lg">
            <Image src={item.image_url} alt="" width={120} height={120} className="h-full w-full object-cover" />
          </div>
        ))}
        <Link href="/dashboard/portfolio" className="border-ds-border text-dim hover:text-(--text) aspect-square flex items-center justify-center rounded-lg border border-dashed transition-colors" aria-label="Add photos">
          <Plus size={20} aria-hidden />
        </Link>
      </div>
      <Link href="/dashboard/portfolio" className="mx-[18px] mt-[14px] flex h-[46px] w-[calc(100%-36px)] items-center justify-center gap-2 rounded-full bg-ink-spot font-mono text-[11px] tracking-[0.12em] uppercase text-(--accent-ink) transition-opacity hover:opacity-90">
        <Camera size={14} aria-hidden /> Manage photos
      </Link>
      <div className="h-10" />
    </div>
  );
}

function MobilePreviewTab({ handle }: { handle: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-surface border-hairline flex shrink-0 items-center gap-2 border-b px-[18px] py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-dim">
        <AccentDot size={5} /> Preview · what clients see
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-[18px] pb-20">
        <User size={40} className="text-surface-3" aria-hidden />
        <div className="space-y-1.5 text-center">
          <p className="text-[15px] font-medium">Your public profile</p>
          <p className="text-text-2 text-[13px]">See exactly what clients see when they find you</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Link href={`/artist/${handle}`} className="border-ds-border flex h-11 items-center gap-2 rounded-full border bg-surface-2 px-5 font-mono text-[10px] tracking-[0.12em] uppercase text-(--text) transition-colors hover:bg-surface-3">
            View public profile <ArrowRight size={12} aria-hidden />
          </Link>
          <Link href="/dashboard/profile" className="text-faint hover:text-dim font-mono text-[10px] tracking-[0.12em] uppercase transition-colors">
            Edit profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { id: Tab; Icon: React.ElementType; label: string }[] = [
    { id: "home",      Icon: BarChart2,     label: "Home"      },
    { id: "inquiries", Icon: MessageSquare, label: "Inbox"     },
    { id: "portfolio", Icon: Grid2x2,       label: "Portfolio" },
    { id: "preview",   Icon: User,          label: "Profile"   },
  ];
  return (
    <nav className="border-hairline z-10 grid shrink-0 grid-cols-4 border-t"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>
      {tabs.map(({ id, Icon, label }) => (
        <button key={id} type="button" onClick={() => setTab(id)}
          className={cn("flex flex-col items-center gap-1 pt-2.5 pb-1 font-mono text-[9px] tracking-[0.12em] uppercase transition-colors", tab === id ? "text-(--text)" : "text-faint")}>
          <Icon size={22} aria-hidden className={tab === id ? "text-ink-spot" : ""} />
          {label}
        </button>
      ))}
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DESKTOP LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

function DesktopTopBar({ tab, setTab, data }: { tab: Tab; setTab: (t: Tab) => void; data: DashboardData }) {
  const initials = data.displayName.slice(0, 2).toUpperCase();
  const tabs: { id: Tab; Icon: React.ElementType; label: string }[] = [
    { id: "home",      Icon: BarChart2,     label: "Home"      },
    { id: "inquiries", Icon: MessageSquare, label: "Inquiries" },
    { id: "portfolio", Icon: Grid2x2,       label: "Portfolio" },
    { id: "preview",   Icon: User,          label: "Profile"   },
  ];
  return (
    <header className="border-hairline bg-[rgba(8,8,8,0.85)] sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b px-8"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      {/* Left: wordmark + tabs */}
      <div className="flex items-center gap-9">
        <div className="flex items-center gap-1 text-[20px] font-semibold tracking-[-0.02em]">
          InkSpot
          <span className="bg-ink-spot ml-0.5 inline-block size-2 -translate-y-2 rounded-full"
            style={{ boxShadow: "0 0 12px var(--accent-glow)" }} />
        </div>
        <nav className="flex gap-1">
          {tabs.map(({ id, Icon, label }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={cn("flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] transition-colors",
                tab === id ? "bg-surface-2 text-(--text) [&_svg]:text-ink-spot" : "text-text-2 hover:text-(--text) hover:bg-surface")}>
              <Icon size={16} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Right: exit + avatar */}
      <div className="flex items-center gap-3.5">
        <Link href="/explore"
          className="border-hairline flex items-center gap-2 rounded-full border px-[11px] py-[7px] font-mono text-[10px] tracking-[0.12em] uppercase text-text-2 transition-colors hover:bg-surface hover:text-(--text)">
          <AccentDot size={5} />
          Artist · exit
        </Link>
        <div className="bg-surface border-hairline overflow-hidden rounded-full border size-[38px] shrink-0">
          <DashboardAvatar src={data.profileImageUrl} initials={initials} size="sm" />
        </div>
      </div>
    </header>
  );
}

function DesktopHomeTab({ data }: { data: DashboardData }) {
  const firstName = data.displayName.split(" ")[0];
  const flat = [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="mx-auto w-full max-w-[1140px] px-8 py-6">
      {/* Greeting row */}
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <div className="text-[38px] font-medium leading-none tracking-tight">
            Hola, <span className="text-ink-spot">{firstName}</span>
          </div>
          <div className="text-dim mt-3 font-mono text-[11px] tracking-[0.14em] uppercase">
            Here&rsquo;s your week on InkSpot
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="border-hairline flex items-center gap-2 rounded-full border px-[14px] py-[9px] font-mono text-[11px] tracking-widest uppercase text-text-2">
            <span className="size-[7px] shrink-0 rounded-full"
              style={{ background: data.isActive ? "#3ddc84" : "var(--dim)", boxShadow: data.isActive ? "0 0 10px rgba(61,220,132,0.6)" : "none" }} />
            {data.isActive ? "Live & visible" : "Profile hidden"}
            {data.currentLocation && (
              <span className="text-dim pl-1">{data.currentLocation.location_name.split(",")[0]}</span>
            )}
          </div>
          {!data.isClaimed && (
            <div className="rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] px-[14px] py-[9px] font-mono text-[11px] tracking-widest uppercase text-demo">
              Verification pending
            </div>
          )}
        </div>
      </div>

      {/* 4-col stats */}
      <div className="mb-5 grid grid-cols-4 gap-[14px]">
        <StatCell large label="Profile views" value="—" delta={0} data={flat} />
        <StatCell large label="Search hits"   value="—" delta={0} data={flat} />
        <StatCell large label="Shortlisted"   value="—" delta={0} data={flat} />
        <StatCell large label="Inquiries"     value="—" delta={0} data={flat} />
      </div>

      {/* 2-col grid: left (AI + Inquiries) | right (Location + Portfolio) */}
      <div className="grid grid-cols-[1fr_360px] items-start gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* AI panel */}
          <div className="bg-surface border-hairline rounded-[18px] border overflow-hidden">
            <AiPanel flush />
          </div>

          {/* Inquiries card */}
          <div className="bg-surface border-hairline rounded-[18px] border overflow-hidden">
            <div className="flex items-baseline justify-between border-b border-hairline px-6 py-5">
              <span className="text-[22px] font-medium tracking-tight">Inquiries</span>
              <span className="text-dim font-mono text-[10px] tracking-widest uppercase">0 new</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Inbox size={28} className="text-surface-3" aria-hidden />
              <p className="text-text-2 text-[13px]">No inquiries yet</p>
              <p className="text-faint font-mono text-[9px] tracking-widest uppercase">Client messaging coming soon</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Location + travel */}
          <div className="bg-surface border-hairline rounded-[18px] border p-[22px_24px]">
            <div className="text-dim mb-[14px] font-mono text-[10px] tracking-[0.14em] uppercase">Where you are</div>
            <LocationWidget data={data} />
            <Link href="/dashboard/locations"
              className="mt-[14px] flex h-[46px] w-full items-center justify-center gap-2 rounded-full border border-ds-border bg-surface-2 font-mono text-[11px] tracking-[0.12em] uppercase text-(--text) transition-colors hover:bg-surface-3">
              <Calendar size={14} aria-hidden /> Manage travel
            </Link>
          </div>

          {/* Portfolio snapshot */}
          <div className="bg-surface border-hairline rounded-[18px] border p-[22px_24px]">
            <div className="flex items-baseline justify-between mb-[14px]">
              <span className="text-[22px] font-medium tracking-tight">Portfolio</span>
              <Link href="/dashboard/portfolio" className="text-ink-spot font-mono text-[10px] tracking-widest uppercase">
                {data.portfolioItems.length} photos →
              </Link>
            </div>
            {data.portfolioItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {data.portfolioItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="aspect-square overflow-hidden rounded-lg">
                    <Image src={item.image_url} alt="" width={120} height={120} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-ds-border flex aspect-[3/1] items-center justify-center rounded-xl border border-dashed">
                <p className="text-faint font-mono text-[10px] tracking-widest uppercase">No photos yet</p>
              </div>
            )}
            <Link href="/dashboard/portfolio"
              className="mt-[14px] flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-ink-spot font-mono text-[11px] tracking-[0.12em] uppercase text-(--accent-ink) transition-opacity hover:opacity-90">
              <Camera size={13} aria-hidden /> Manage photos
            </Link>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

function DesktopInquiriesTab() {
  return (
    <div className="mx-auto w-full max-w-[1140px] px-8 py-6">
      <div className="mb-5 flex items-baseline gap-3.5">
        <span className="text-[34px] font-medium leading-none tracking-tight">Inquiries</span>
        <span className="text-ink-spot font-mono text-[11px] tracking-[0.12em] uppercase">0 new</span>
      </div>
      <div className="bg-surface border-hairline flex min-h-[500px] items-center justify-center rounded-[18px] border">
        <div className="flex flex-col items-center gap-3 text-center">
          <Inbox size={36} className="text-surface-3" aria-hidden />
          <p className="text-text-2 text-[15px]">No inquiries yet</p>
          <p className="text-faint font-mono text-[10px] tracking-widest uppercase">Client messaging coming soon</p>
        </div>
      </div>
    </div>
  );
}

function DesktopPortfolioTab({ items }: { items: DashboardData["portfolioItems"] }) {
  return (
    <div className="mx-auto w-full max-w-[1140px] px-8 py-6">
      <div className="mb-5 flex items-baseline gap-3.5">
        <span className="text-[34px] font-medium leading-none tracking-tight">Portfolio</span>
        <span className="text-dim font-mono text-[11px] tracking-[0.12em] uppercase">{items.length} photos</span>
      </div>
      <div className="grid grid-cols-[1fr_260px] items-start gap-5">
        {/* Grid */}
        <div className="bg-surface border-hairline rounded-[18px] border p-4">
          {items.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <div key={item.id} className="aspect-square overflow-hidden rounded-lg">
                  <Image src={item.image_url} alt="" width={200} height={200} className="h-full w-full object-cover" />
                </div>
              ))}
              <Link href="/dashboard/portfolio" className="border-ds-border text-dim hover:text-(--text) aspect-square flex items-center justify-center rounded-lg border border-dashed transition-colors" aria-label="Add">
                <Plus size={24} aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center">
              <p className="text-faint font-mono text-[10px] tracking-widest uppercase">No photos yet</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Link href="/dashboard/portfolio"
            className="flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-ink-spot font-mono text-[11px] tracking-[0.12em] uppercase text-(--accent-ink) transition-opacity hover:opacity-90">
            <Camera size={14} aria-hidden /> Add photos
          </Link>
          <div className="bg-surface border-hairline rounded-[18px] border p-5">
            <div className="text-dim mb-4 font-mono text-[10px] tracking-[0.14em] uppercase">Profile strength</div>
            <p className="text-faint text-[13px]">Style analytics will appear here once you&rsquo;ve uploaded photos and they&rsquo;re classified by AI.</p>
          </div>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

function DesktopPreviewTab({ handle }: { handle: string }) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-8 py-6">
      <div className="bg-surface border-hairline overflow-hidden rounded-[18px] border">
        <div className="border-hairline flex items-center gap-2 border-b px-6 py-3 font-mono text-[10px] tracking-[0.12em] uppercase text-dim">
          <AccentDot size={5} /> Preview · what clients see
        </div>
        <div className="flex flex-col items-center gap-5 py-14">
          <User size={44} className="text-surface-3" aria-hidden />
          <div className="space-y-1.5 text-center">
            <p className="text-[16px] font-medium">Your public profile</p>
            <p className="text-text-2 text-[13px]">See exactly what clients see when they find you</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/artist/${handle}`}
              className="border-ds-border flex h-11 items-center gap-2 rounded-full border bg-surface-2 px-5 font-mono text-[10px] tracking-[0.12em] uppercase text-(--text) transition-colors hover:bg-surface-3">
              View public profile <ArrowRight size={12} aria-hidden />
            </Link>
            <Link href="/dashboard/profile"
              className="border-ds-border flex h-11 items-center gap-2 rounded-full border bg-surface-2 px-5 font-mono text-[10px] tracking-[0.12em] uppercase text-(--text) transition-colors hover:bg-surface-3">
              Edit profile
            </Link>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-faint hover:text-dim flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition-colors">
              <LogOut size={12} aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SHELL
// ══════════════════════════════════════════════════════════════════════════════

export function DashboardClient({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <>
      {/* ── Mobile layout (hidden on lg+) ─────────────────────────────────── */}
      <div className="fixed inset-0 flex flex-col bg-(--bg) text-(--text) lg:hidden">
        {/* Mobile top bar */}
        <div className="relative z-10 flex shrink-0 items-center justify-between px-[18px] pb-2.5 pt-[14px]">
          <div className="flex items-center gap-0.5 text-[22px] font-medium tracking-tight">
            InkSpot
            <span className="ml-[3px] inline-block size-[6px] -translate-y-2 rounded-full bg-ink-spot"
              style={{ boxShadow: "0 0 12px var(--accent-glow)" }} />
          </div>
          <Link href="/explore"
            className="border-hairline flex items-center gap-2 rounded-full border px-[11px] py-1.5 transition-colors hover:bg-surface">
            <AccentDot size={5} />
            <span className="text-text-2 font-mono text-[10px] tracking-[0.12em] uppercase">
              Artist · exit
            </span>
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === "home"      && <MobileHomeTab data={data} />}
          {tab === "inquiries" && <MobileInquiriesTab />}
          {tab === "portfolio" && <MobilePortfolioTab items={data.portfolioItems} handle={data.handle} />}
          {tab === "preview"   && <MobilePreviewTab handle={data.handle} />}
        </div>

        <MobileBottomNav tab={tab} setTab={setTab} />
      </div>

      {/* ── Desktop layout (hidden below lg) ──────────────────────────────── */}
      <div className="hidden h-screen flex-col bg-(--bg) text-(--text) lg:flex">
        <DesktopTopBar tab={tab} setTab={setTab} data={data} />
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--surface-3)_transparent]">
          {tab === "home"      && <DesktopHomeTab data={data} />}
          {tab === "inquiries" && <DesktopInquiriesTab />}
          {tab === "portfolio" && <DesktopPortfolioTab items={data.portfolioItems} />}
          {tab === "preview"   && <DesktopPreviewTab handle={data.handle} />}
        </div>
      </div>
    </>
  );
}
