"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Save, Search } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { cn, formatCompact } from "@/lib/format";

export type AdminStockRow = {
  id: string;
  name: string;
  ticker: string;
  emoji: string;
  gradient: string;
  price: number;
  basePrice: number;
  liquidity: number;
  floatShares: number;
  seriesName: string;
  categoryName: string;
  categorySlug: string;
  categoryEmoji: string;
};

export type CategoryOption = { slug: string; name: string; emoji: string };

type StockActions = {
  updateQuick: (id: string, formData: FormData) => Promise<void> | void;
  delete: (id: string) => Promise<void> | void;
};

export function StocksTable({
  stocks,
  categories,
  actions,
}: {
  stocks: AdminStockRow[];
  categories: CategoryOption[];
  actions: StockActions;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    let arr =
      cat === "all" ? stocks : stocks.filter((s) => s.categorySlug === cat);
    const query = q.trim().toLowerCase();
    if (query) {
      arr = arr.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.ticker.toLowerCase().includes(query) ||
          s.seriesName.toLowerCase().includes(query),
      );
    }
    return arr;
  }, [q, cat, stocks]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ticker, series…"
            className="input pl-9"
          />
        </div>
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
      </div>

      <div className="text-xs text-zinc-500">
        Showing {filtered.length} of {stocks.length} stocks. Edit numbers inline
        and hit Save per row.
      </div>

      <div className="card divide-y divide-white/5">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_repeat(3,minmax(0,1fr))_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 lg:grid">
          <span>Character</span>
          <span className="text-right">Price</span>
          <span className="text-right">Base</span>
          <span className="text-right">Liquidity</span>
          <span />
        </div>
        {filtered.map((s) => (
          <form
            key={s.id}
            action={actions.updateQuick.bind(null, s.id)}
            className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[minmax(0,2.4fr)_repeat(3,minmax(0,1fr))_auto] lg:items-center"
          >
            <div className="flex items-center gap-3">
              <Avatar emoji={s.emoji} gradient={s.gradient} size="sm" />
              <div className="min-w-0">
                <div className="truncate font-medium text-zinc-100">
                  {s.name}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  <span className="font-mono text-zinc-400">{s.ticker}</span> ·{" "}
                  {s.categoryName} · {s.seriesName} · cap{" "}
                  {formatCompact(s.price * s.floatShares)}
                </div>
              </div>
            </div>
            <NumInput name="price" defaultValue={s.price} />
            <NumInput name="basePrice" defaultValue={s.basePrice} />
            <NumInput name="liquidity" defaultValue={s.liquidity} step={1} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              <Link
                href={`/admin/stocks/${s.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-semibold text-zinc-300 hover:border-white/25 hover:bg-white/[0.07]"
                title="Edit all fields"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
              <DeleteButton
                small
                label=""
                action={actions.delete.bind(null, s.id)}
                confirmText={`Delete ${s.name}? Holdings and history will be wiped.`}
              />
            </div>
          </form>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            No matches.
          </div>
        )}
      </div>
    </div>
  );
}

function NumInput({
  name,
  defaultValue,
  step = 0.01,
}: {
  name: string;
  defaultValue: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      name={name}
      defaultValue={defaultValue}
      step={step}
      min={step}
      className="input h-9 w-full px-2 py-1 text-right font-mono text-sm lg:h-8"
      required
    />
  );
}
