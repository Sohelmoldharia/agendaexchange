"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CategoryView, StockView } from "@/lib/queries";
import { cn } from "@/lib/format";
import { StockCard } from "./StockCard";

const SORTS = [
  { key: "cap", label: "Market cap" },
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
  { key: "price", label: "Price" },
  { key: "az", label: "A–Z" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

type ViewMode = "browse" | "sort";

export function MarketBrowser({
  stocks,
  categories,
}: {
  stocks: StockView[];
  categories: CategoryView[];
}) {
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("cap");
  const [view, setView] = useState<ViewMode>("browse");

  const filtered = useMemo(
    () =>
      cat === "all" ? stocks : stocks.filter((s) => s.categorySlug === cat),
    [cat, stocks],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "gainers":
        arr.sort((a, b) => b.change24h - a.change24h);
        break;
      case "losers":
        arr.sort((a, b) => a.change24h - b.change24h);
        break;
      case "price":
        arr.sort((a, b) => b.price - a.price);
        break;
      case "az":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        arr.sort((a, b) => b.marketCap - a.marketCap);
    }
    return arr;
  }, [filtered, sort]);

  // Group filtered stocks by category (preserving the categories prop order),
  // then by series (alphabetical) — the "browse" view.
  const groups = useMemo(() => {
    const catOrder = new Map(categories.map((c, i) => [c.slug, i]));
    const byCat = new Map<string, Map<string, StockView[]>>();
    for (const s of filtered) {
      let bySeries = byCat.get(s.categorySlug);
      if (!bySeries) {
        bySeries = new Map();
        byCat.set(s.categorySlug, bySeries);
      }
      const arr = bySeries.get(s.seriesSlug) ?? [];
      arr.push(s);
      bySeries.set(s.seriesSlug, arr);
    }
    return [...byCat.entries()]
      .map(([catSlug, bySeries]) => {
        const category = categories.find((c) => c.slug === catSlug)!;
        const series = [...bySeries.values()]
          .map((arr) => ({
            name: arr[0].seriesName,
            slug: arr[0].seriesSlug,
            emoji: arr[0].seriesEmoji,
            stocks: [...arr].sort((a, b) => a.name.localeCompare(b.name)),
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        return { category, series };
      })
      .sort(
        (a, b) =>
          (catOrder.get(a.category.slug) ?? 0) -
          (catOrder.get(b.category.slug) ?? 0),
      );
  }, [filtered, categories]);

  return (
    <div>
      {/* Filters + view toggle */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={cn("chip", cat === "all" && "chip-active")}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={cn("chip", cat === c.slug && "chip-active")}
            >
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1">
          {(["browse", "sort"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                view === m
                  ? "bg-white/15 text-white"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              {m === "browse" ? "Browse by series" : "Sort flat"}
            </button>
          ))}
        </div>
      </div>

      {view === "sort" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Sort by</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn("chip", sort === s.key && "chip-active")}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 text-sm text-zinc-500">
        {filtered.length} {filtered.length === 1 ? "character" : "characters"}
      </div>

      {view === "sort" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-14">
          {groups.map((g) => (
            <section key={g.category.slug}>
              <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <div
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-25 blur-2xl",
                    g.category.gradient,
                  )}
                />
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg",
                      g.category.gradient,
                    )}
                  >
                    {g.category.emoji}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">
                      {g.category.name}
                    </h2>
                    <p className="text-sm text-zinc-400">{g.category.blurb}</p>
                  </div>
                  <Link
                    href={`/category/${g.category.slug}`}
                    className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 sm:flex"
                  >
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="space-y-10">
                {g.series.map((ser) => (
                  <div key={ser.slug}>
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <Link
                        href={`/series/${ser.slug}`}
                        className="group flex items-baseline gap-2"
                      >
                        <span className="text-2xl">{ser.emoji}</span>
                        <h3 className="text-lg font-bold text-white">
                          {ser.name}
                        </h3>
                        <span className="text-xs text-zinc-500">
                          {ser.stocks.length}{" "}
                          {ser.stocks.length === 1 ? "character" : "characters"}
                        </span>
                      </Link>
                      <Link
                        href={`/series/${ser.slug}`}
                        className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200 sm:inline-flex"
                      >
                        Open <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {ser.stocks.map((s) => (
                        <StockCard key={s.id} stock={s} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
