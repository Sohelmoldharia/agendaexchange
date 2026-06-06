"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/format";
import { BLOCKED_META, KIND_META, STATUS_META, type FilterKey } from "@/lib/anime/meta";
import { isBlocked, type AnimeSite, type SiteKind } from "@/lib/anime/sites";
import { SiteCard } from "./SiteCard";

const STATUS_FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "legal", label: STATUS_META.legal.label },
  { key: "free", label: STATUS_META.free.label },
  { key: "blocked", label: BLOCKED_META.label },
  { key: "shutdown", label: STATUS_META.shutdown.label },
];

const KIND_FILTERS: { key: SiteKind | "all"; label: string }[] = [
  { key: "all", label: "Every type" },
  ...(Object.keys(KIND_META) as SiteKind[]).map((k) => ({
    key: k,
    label: KIND_META[k].label,
  })),
];

function matchesStatus(site: AnimeSite, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "blocked") return isBlocked(site);
  return site.status === f;
}

export function SiteExplorer({
  sites,
  initialStatus = "all",
}: {
  sites: AnimeSite[];
  initialStatus?: FilterKey;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterKey>(initialStatus);
  const [kind, setKind] = useState<SiteKind | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((s) => {
      if (!matchesStatus(s, status)) return false;
      if (kind !== "all" && s.kind !== kind) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.blurb.toLowerCase().includes(q) ||
        s.features.some((f) => f.toLowerCase().includes(q)) ||
        (s.region?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sites, query, status, kind]);

  return (
    <div>
      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sites, features, regions…"
          className="input pl-11"
          aria-label="Search anime sites"
        />
      </div>

      {/* status pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatus(f.key)}
            className={cn("chip", status === f.key && "chip-active")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* kind pills */}
      <div className="mt-2 flex flex-wrap gap-2">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setKind(f.key)}
            className={cn(
              "chip text-xs",
              kind === f.key && "chip-active",
            )}
          >
            {f.key !== "all" && `${KIND_META[f.key as SiteKind].emoji} `}
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm text-zinc-500">
        {results.length} {results.length === 1 ? "site" : "sites"}
      </p>

      {results.length > 0 ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <SiteCard key={s.slug} site={s} />
          ))}
        </div>
      ) : (
        <div className="card mt-3 p-10 text-center text-zinc-500">
          No sites match those filters.
        </div>
      )}
    </div>
  );
}
