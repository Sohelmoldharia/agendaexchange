"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/format";
import { isBlocked, regionGroup, type AnimeSite } from "@/lib/anime/sites";
import { SiteRow } from "./SiteRow";

type StatusFilter = "all" | "legal" | "free" | "blocked" | "shutdown";

const STATUS_FILTERS: { k: StatusFilter; label: string; dot?: string }[] = [
  { k: "all", label: "All" },
  { k: "legal", label: "Official", dot: "bg-emerald-400" },
  { k: "free", label: "Free", dot: "bg-amber-400" },
  { k: "blocked", label: "Blocked", dot: "bg-rose-400" },
  { k: "shutdown", label: "Defunct", dot: "bg-zinc-500" },
];

type Section = { key: string; kind: string; label: string; emoji: string };
const SECTION_ORDER: Section[] = [
  { key: "stream:global", kind: "stream", label: "Streaming · Global / EN", emoji: "📺" },
  { key: "stream:asia", kind: "stream", label: "Streaming · Asia", emoji: "🌏" },
  { key: "stream:europe", kind: "stream", label: "Streaming · Europe", emoji: "🇪🇺" },
  { key: "stream:latam", kind: "stream", label: "Streaming · Latin America", emoji: "🌎" },
  { key: "stream:other", kind: "stream", label: "Streaming · Other regions", emoji: "🌍" },
  { key: "donghua", kind: "donghua", label: "Donghua", emoji: "🐉" },
  { key: "manga", kind: "manga", label: "Manga & Reading", emoji: "📖" },
  { key: "novel", kind: "novel", label: "Light Novels", emoji: "📕" },
  { key: "download", kind: "download", label: "Downloads & Torrents", emoji: "🧲" },
  { key: "schedule", kind: "schedule", label: "Release Schedule", emoji: "🗓️" },
  { key: "database", kind: "database", label: "Databases & Trackers", emoji: "🗂️" },
  { key: "app", kind: "app", label: "Apps & Tools", emoji: "📱" },
  { key: "news", kind: "news", label: "News", emoji: "📰" },
];

const CATEGORY_PILLS: { v: string; label: string }[] = [
  { v: "any", label: "All" },
  { v: "stream", label: "📺 Streaming" },
  { v: "donghua", label: "🐉 Donghua" },
  { v: "manga", label: "📖 Manga" },
  { v: "novel", label: "📕 Novels" },
  { v: "download", label: "🧲 Downloads" },
  { v: "schedule", label: "🗓️ Schedule" },
  { v: "database", label: "🗂️ Trackers" },
  { v: "app", label: "📱 Apps" },
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
  const [category, setCategory] = useState("any");

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
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
      {/* hero */}
      <section className="py-10 text-center sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          The anime site index
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          A curated directory of every anime &amp; manga site — official, free,
          blocked, or shut down. {counts.total} sites, searchable.
        </p>
        <div className="relative mx-auto mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, feature, or region…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-12 pr-11 text-base text-zinc-100 shadow-lg shadow-black/20 outline-none placeholder:text-zinc-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/25"
            aria-label="Search sites"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      {/* sticky filters */}
      <div className="sticky top-[57px] z-20 -mx-4 border-y border-white/[0.06] bg-[#0b0b0f]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_PILLS.map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setCategory(c.v)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                category === c.v
                  ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setStatus(f.k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                status === f.k
                  ? "border-white/25 bg-white/10 text-white"
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

      {/* results */}
      {filtered.length === 0 ? (
        <div className="my-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-12 text-center text-zinc-500">
          No sites match those filters.
        </div>
      ) : (
        <div className="mt-6 gap-5 pb-16 md:columns-2 xl:columns-3">
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
    <section className="mb-5 inline-block w-full break-inside-avoid overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-sm">
            {section.emoji}
          </span>
          {section.label}
        </span>
        <span className="text-xs tabular-nums text-zinc-500">{rows.length}</span>
      </header>
      {featureOptions.length >= 3 && (
        <div className="border-b border-white/[0.07] px-3 py-2">
          <select
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            aria-label={`Filter ${section.label} by feature`}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-violet-400/50"
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
            className="w-full rounded-md px-2.5 py-2 text-left text-xs font-medium text-violet-300/80 hover:bg-white/5 hover:text-violet-200"
          >
            Show all {visible.length} →
          </button>
        )}
      </div>
    </section>
  );
}
