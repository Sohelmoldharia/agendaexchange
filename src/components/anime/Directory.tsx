"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/format";
import {
  isBlocked,
  regionGroup,
  type AnimeSite,
} from "@/lib/anime/sites";
import { SiteRow } from "./SiteRow";

type StatusFilter = "all" | "legal" | "free" | "blocked" | "shutdown";

const STATUS_FILTERS: { k: StatusFilter; label: string; dot?: string }[] = [
  { k: "all", label: "All" },
  { k: "legal", label: "Official", dot: "bg-emerald-400" },
  { k: "free", label: "Free", dot: "bg-amber-400" },
  { k: "blocked", label: "Blocked", dot: "bg-rose-400" },
  { k: "shutdown", label: "Defunct", dot: "bg-zinc-500" },
];

// Streaming is split by region; everything else is one box per kind.
const SECTION_ORDER: { key: string; label: string; emoji: string }[] = [
  { key: "stream:global", label: "Streaming · Global / EN", emoji: "📺" },
  { key: "stream:asia", label: "Streaming · Asia", emoji: "🌏" },
  { key: "stream:europe", label: "Streaming · Europe", emoji: "🇪🇺" },
  { key: "stream:latam", label: "Streaming · Latin America", emoji: "🌎" },
  { key: "stream:other", label: "Streaming · Other regions", emoji: "🌍" },
  { key: "manga", label: "Manga & Reading", emoji: "📖" },
  { key: "download", label: "Downloads & Torrents", emoji: "🧲" },
  { key: "database", label: "Databases & Trackers", emoji: "🗂️" },
  { key: "news", label: "News", emoji: "📰" },
];

const STATUS_RANK: Record<AnimeSite["status"], number> = {
  legal: 0,
  free: 1,
  shutdown: 2,
};
const CAP = 12;

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  return (
    <div>
      {/* toolbar */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[var(--background)]/90 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 200+ sites by name, feature, or region…"
            className="w-full rounded border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/25"
            aria-label="Search sites"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.k}
              type="button"
              onClick={() => setStatus(f.k)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors",
                status === f.k
                  ? "border-white/25 bg-white/10 text-white"
                  : "border-white/10 text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
              )}
            >
              {f.dot && <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />}
              {f.label}
            </button>
          ))}
          <span className="ml-auto hidden text-[11px] text-zinc-600 sm:block">
            {filtered.length} of {counts.total} sites
          </span>
        </div>
      </div>

      {/* count legend */}
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <Legend dot="bg-emerald-400" n={counts.legal} label="official" />
        <Legend dot="bg-amber-400" n={counts.free} label="free" />
        <Legend dot="bg-rose-400" n={counts.blocked} label="blocked somewhere" />
        <Legend dot="bg-zinc-500" n={counts.shutdown} label="defunct" />
      </p>

      {/* masonry of category boxes */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-md border border-white/10 bg-white/[0.015] p-10 text-center text-sm text-zinc-500">
          No sites match those filters.
        </div>
      ) : (
        <div className="mt-4 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
          {SECTION_ORDER.map((sec) => {
            const rows = grouped.get(sec.key);
            if (!rows || rows.length === 0) return null;
            const isOpen = filtering || expanded.has(sec.key);
            const shown = isOpen ? rows : rows.slice(0, CAP);
            const hiddenCount = rows.length - shown.length;
            return (
              <section
                key={sec.key}
                className="mb-3 inline-block w-full break-inside-avoid rounded-md border border-white/10 bg-white/[0.015]"
              >
                <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-200">
                    <span>{sec.emoji}</span>
                    {sec.label}
                  </span>
                  <span className="text-[11px] tabular-nums text-zinc-600">
                    {rows.length}
                  </span>
                </header>
                <div className="space-y-px p-1.5">
                  {shown.map((s, i) => (
                    <SiteRow key={s.slug} site={s} rank={i + 1} />
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => new Set(prev).add(sec.key))
                      }
                      className="w-full rounded px-2 py-1.5 text-left text-[11px] font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                    >
                      Show all {rows.length} →
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Legend({ dot, n, label }: { dot: string; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="tabular-nums text-zinc-400">{n}</span> {label}
    </span>
  );
}
