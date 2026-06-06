"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/format";
import { isBlocked, regionGroup, type AnimeSite } from "@/lib/anime/sites";
import { SiteRow } from "./SiteRow";

type StatusFilter = "all" | "legal" | "free" | "blocked" | "shutdown";
type CategoryFilter = "any" | string; // "any" | section kind

const STATUS_FILTERS: { k: StatusFilter; label: string; dot?: string }[] = [
  { k: "all", label: "All" },
  { k: "legal", label: "Official", dot: "bg-emerald-400" },
  { k: "free", label: "Free", dot: "bg-amber-400" },
  { k: "blocked", label: "Blocked", dot: "bg-rose-400" },
  { k: "shutdown", label: "Defunct", dot: "bg-zinc-500" },
];

// Each box: streaming is split by region; everything else is one box per kind.
// `kind` ties a box to the category dropdown; `bar` is its accent color.
type Section = { key: string; kind: string; label: string; emoji: string; bar: string };
const SECTION_ORDER: Section[] = [
  { key: "stream:global", kind: "stream", label: "Streaming · Global / EN", emoji: "📺", bar: "border-t-sky-500/60" },
  { key: "stream:asia", kind: "stream", label: "Streaming · Asia", emoji: "🌏", bar: "border-t-sky-500/60" },
  { key: "stream:europe", kind: "stream", label: "Streaming · Europe", emoji: "🇪🇺", bar: "border-t-sky-500/60" },
  { key: "stream:latam", kind: "stream", label: "Streaming · Latin America", emoji: "🌎", bar: "border-t-sky-500/60" },
  { key: "stream:other", kind: "stream", label: "Streaming · Other regions", emoji: "🌍", bar: "border-t-sky-500/60" },
  { key: "donghua", kind: "donghua", label: "Donghua", emoji: "🐉", bar: "border-t-rose-500/60" },
  { key: "manga", kind: "manga", label: "Manga & Reading", emoji: "📖", bar: "border-t-violet-500/60" },
  { key: "novel", kind: "novel", label: "Light Novels", emoji: "📕", bar: "border-t-amber-500/60" },
  { key: "download", kind: "download", label: "Downloads & Torrents", emoji: "🧲", bar: "border-t-cyan-500/60" },
  { key: "schedule", kind: "schedule", label: "Release Schedule", emoji: "🗓️", bar: "border-t-emerald-500/60" },
  { key: "database", kind: "database", label: "Databases & Trackers", emoji: "🗂️", bar: "border-t-indigo-500/60" },
  { key: "app", kind: "app", label: "Apps & Tools", emoji: "📱", bar: "border-t-teal-500/60" },
  { key: "news", kind: "news", label: "News", emoji: "📰", bar: "border-t-fuchsia-500/60" },
];

const CATEGORY_OPTIONS: { v: string; label: string }[] = [
  { v: "any", label: "All categories" },
  { v: "stream", label: "📺 Streaming" },
  { v: "donghua", label: "🐉 Donghua" },
  { v: "manga", label: "📖 Manga & Reading" },
  { v: "novel", label: "📕 Light Novels" },
  { v: "download", label: "🧲 Downloads & Torrents" },
  { v: "schedule", label: "🗓️ Release Schedule" },
  { v: "database", label: "🗂️ Databases & Trackers" },
  { v: "app", label: "📱 Apps & Tools" },
  { v: "news", label: "📰 News" },
];

const STATUS_RANK: Record<AnimeSite["status"], number> = { legal: 0, free: 1, shutdown: 2 };
const CAP = 14;

function sectionKeyFor(s: AnimeSite): string {
  return s.kind === "stream" ? `stream:${regionGroup(s)}` : s.kind;
}

function matchesStatus(site: AnimeSite, f: StatusFilter): boolean {
  if (f === "all") return true;
  if (f === "blocked") return isBlocked(site);
  return site.status === f;
}

export function Directory({
  sites,
  initialStatus = "all",
}: {
  sites: AnimeSite[];
  initialStatus?: StatusFilter;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [category, setCategory] = useState<CategoryFilter>("any");

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0 || status !== "all";

  const filtered = useMemo(() => {
    return sites.filter((s) => {
      if (!matchesStatus(s, status)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.blurb.toLowerCase().includes(q) ||
        s.features.some((f) => f.toLowerCase().includes(q)) ||
        (s.region?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sites, q, status]);

  const grouped = useMemo(() => {
    const map = new Map<string, AnimeSite[]>();
    for (const s of filtered) {
      const key = sectionKeyFor(s);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          Number(!!b.featured) - Number(!!a.featured) ||
          STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
          a.name.localeCompare(b.name),
      );
    }
    return map;
  }, [filtered]);

  const counts = useMemo(
    () => ({
      total: sites.length,
      legal: sites.filter((s) => s.status === "legal").length,
      free: sites.filter((s) => s.status === "free").length,
      shutdown: sites.filter((s) => s.status === "shutdown").length,
      blocked: sites.filter(isBlocked).length,
    }),
    [sites],
  );

  const visibleSections = SECTION_ORDER.filter(
    (s) => category === "any" || s.kind === category,
  );

  return (
    <div>
      {/* toolbar */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[var(--background)]/95 px-4 py-4 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 240+ sites — name, feature, region…"
              className="w-full rounded-lg border border-white/15 bg-black/40 py-3 pl-11 pr-10 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20"
              aria-label="Search sites"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-violet-400/60 sm:w-56"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.v} value={c.v}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setStatus(f.k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                status === f.k
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              )}
            >
              {f.dot && <span className={cn("h-2 w-2 rounded-full", f.dot)} />}
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-zinc-500">
            {filtered.length} of {counts.total}
          </span>
        </div>
      </div>

      {/* count legend */}
      <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
        <Legend dot="bg-emerald-400" n={counts.legal} label="official" />
        <Legend dot="bg-amber-400" n={counts.free} label="free" />
        <Legend dot="bg-rose-400" n={counts.blocked} label="blocked somewhere" />
        <Legend dot="bg-zinc-500" n={counts.shutdown} label="defunct" />
      </p>

      {/* masonry of category boxes */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center text-zinc-500">
          No sites match those filters.
        </div>
      ) : (
        <div className="mt-5 gap-4 md:columns-2 xl:columns-3">
          {visibleSections.map((sec) => {
            const rows = grouped.get(sec.key);
            if (!rows || rows.length === 0) return null;
            return (
              <CategoryBox
                key={sec.key}
                section={sec}
                rows={rows}
                forceOpen={filtering}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryBox({
  section,
  rows,
  forceOpen,
}: {
  section: Section;
  rows: AnimeSite[];
  forceOpen: boolean;
}) {
  const [feature, setFeature] = useState("any");
  const [open, setOpen] = useState(false);

  const featureOptions = useMemo(() => {
    const freq = new Map<string, number>();
    for (const r of rows) for (const f of r.features) freq.set(f, (freq.get(f) ?? 0) + 1);
    return [...freq.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([f]) => f);
  }, [rows]);

  const visible =
    feature === "any" ? rows : rows.filter((r) => r.features.includes(feature));
  const isOpen = forceOpen || open || feature !== "any";
  const shown = isOpen ? visible : visible.slice(0, CAP);
  const hidden = visible.length - shown.length;

  return (
    <section
      className={cn(
        "mb-4 inline-block w-full break-inside-avoid rounded-lg border border-t-2 border-white/10 bg-white/[0.02]",
        section.bar,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-[15px] font-bold text-white">
          <span className="text-base">{section.emoji}</span>
          {section.label}
        </span>
        <span className="text-xs tabular-nums text-zinc-500">{rows.length}</span>
      </header>
      {featureOptions.length >= 3 && (
        <div className="border-b border-white/10 px-2.5 py-2">
          <select
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            aria-label={`Filter ${section.label} by feature`}
            className="w-full rounded border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-white/25"
          >
            <option value="any">Any feature</option>
            {featureOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-0.5 p-2">
        {shown.map((s, i) => (
          <SiteRow key={s.slug} site={s} rank={i + 1} />
        ))}
        {visible.length === 0 && (
          <p className="px-2.5 py-2 text-xs text-zinc-600">
            No matches for that feature.
          </p>
        )}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full rounded-md px-2.5 py-2 text-left text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          >
            Show all {visible.length} →
          </button>
        )}
      </div>
    </section>
  );
}

function Legend({ dot, n, label }: { dot: string; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span className="tabular-nums text-zinc-300">{n}</span> {label}
    </span>
  );
}
