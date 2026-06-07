import type { SiteKind, SiteStatus } from "./sites";

/** Public base URL for canonical links, sitemap, OG tags. Set in .env. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export const BRAND = {
  name: "Anime Index",
  full: "Anime Index — Every anime site, mapped",
  tagline: "Legal, free, blocked, or long gone.",
  blurb:
    "A directory of the entire anime-site landscape — official streamers, free (unofficial) sites, region-blocked ones, and the graveyard of shut-down services. Informational only: we don't host or stream anything.",
};

// "blocked" isn't a real status field — it's derived from `blockedIn` — but we
// surface it as a first-class filter alongside the three lifecycle statuses.
export type FilterKey = SiteStatus | "blocked" | "all";

export interface StatusMeta {
  label: string;
  short: string;
  description: string;
  /** Tailwind classes for a pill/badge (kept as literals so the scanner sees them). */
  badge: string;
  dot: string;
  text: string;
}

export const STATUS_META: Record<SiteStatus, StatusMeta> = {
  legal: {
    label: "Official",
    short: "Legal",
    description: "Licensed services that pay the people who make anime.",
    badge: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  free: {
    label: "Free / Unofficial",
    short: "Free",
    description: "Unlicensed free sites. Legality is dubious and varies by country.",
    badge: "border-amber-400/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  shutdown: {
    label: "Shut down",
    short: "Defunct",
    description: "Gone for good — closed, merged, or seized.",
    badge: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    dot: "bg-zinc-500",
    text: "text-zinc-400",
  },
};

export const BLOCKED_META: StatusMeta = {
  label: "Blocked",
  short: "Blocked",
  description: "Reachable, but ISP- or court-blocked in one or more countries.",
  badge: "border-rose-400/30 bg-rose-500/10 text-rose-300",
  dot: "bg-rose-400",
  text: "text-rose-300",
};

export interface KindMeta {
  label: string;
  emoji: string;
}

export const KIND_META: Record<SiteKind, KindMeta> = {
  stream: { label: "Streaming", emoji: "📺" },
  donghua: { label: "Donghua", emoji: "🐉" },
  manga: { label: "Manga / reading", emoji: "📖" },
  novel: { label: "Light novels", emoji: "📕" },
  download: { label: "Download / torrents", emoji: "🧲" },
  database: { label: "Database / tracker", emoji: "🗂️" },
  schedule: { label: "Release schedule", emoji: "🗓️" },
  app: { label: "Apps & tools", emoji: "📱" },
  news: { label: "News", emoji: "📰" },
};
