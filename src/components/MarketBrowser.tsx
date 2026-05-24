"use client";

import { useMemo, useState } from "react";
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

export function MarketBrowser({
  stocks,
  categories,
}: {
  stocks: StockView[];
  categories: CategoryView[];
}) {
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("cap");

  const list = useMemo(() => {
    let arr = cat === "all" ? stocks : stocks.filter((s) => s.categorySlug === cat);
    arr = [...arr];
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
  }, [cat, sort, stocks]);

  return (
    <div>
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">Sort</span>
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
      </div>

      <div className="mt-3 text-sm text-zinc-500">
        {list.length} {list.length === 1 ? "character" : "characters"}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((s) => (
          <StockCard key={s.id} stock={s} />
        ))}
      </div>
    </div>
  );
}
