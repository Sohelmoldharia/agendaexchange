import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import {
  getSeriesBySlug,
  getStockViewsBySeries,
} from "@/lib/queries";
import {
  cn,
  formatCompact,
  formatPercent,
} from "@/lib/format";
import { StockCard } from "@/components/StockCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  return { title: series ? series.name : "Series" };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [series, stocks] = await Promise.all([
    getSeriesBySlug(slug),
    getStockViewsBySeries(slug),
  ]);
  if (!series) notFound();

  const avgChange =
    stocks.length === 0
      ? 0
      : stocks.reduce((s, x) => s + x.change24h, 0) / stocks.length;
  const totalCap = stocks.reduce((s, x) => s + x.marketCap, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/market" className="hover:text-white">
          Market
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/category/${series.category.slug}`}
          className="hover:text-white"
        >
          {series.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-300">{series.name}</span>
      </nav>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br text-5xl shadow-lg",
              series.category.gradient,
            )}
          >
            {series.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{series.name}</h1>
            <p className="mt-1 max-w-md text-zinc-400">{series.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/category/${series.category.slug}`}
                className="chip hover:border-white/25"
              >
                <span>{series.category.emoji}</span> {series.category.name}
              </Link>
              <span className="chip">{stocks.length} characters</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Stat label="Avg 24h" value={formatPercent(avgChange)} tone={avgChange >= 0 ? "up" : "down"} />
          <Stat label="Total cap" value={formatCompact(totalCap)} />
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stocks.map((s) => (
          <StockCard key={s.id} stock={s} />
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="card px-4 py-3">
      <div className="label">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono text-lg font-bold",
          tone === "up"
            ? "text-emerald-400"
            : tone === "down"
              ? "text-rose-400"
              : "text-white",
        )}
      >
        {value}
      </div>
    </div>
  );
}
