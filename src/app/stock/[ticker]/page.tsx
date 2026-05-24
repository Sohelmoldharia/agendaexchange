import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import {
  getSeriesPeers,
  getStockHistory,
  getStockViewByTicker,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cn,
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  formatSignedMoney,
} from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { ChangeBadge } from "@/components/ChangeBadge";
import { PriceChart } from "@/components/PriceChart";
import { TradePanel } from "@/components/TradePanel";
import { WatchButton } from "@/components/WatchButton";
import { StockCard } from "@/components/StockCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const stock = await getStockViewByTicker(ticker);
  return {
    title: stock ? `${stock.name} (${stock.ticker})` : "Stock",
  };
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const stock = await getStockViewByTicker(ticker);
  if (!stock) notFound();

  const user = await getCurrentUser();
  const [holding, watching, history, peers] = await Promise.all([
    user
      ? prisma.holding.findUnique({
          where: { userId_stockId: { userId: user.id, stockId: stock.id } },
        })
      : Promise.resolve(null),
    user
      ? prisma.watchlistItem
          .findUnique({
            where: { userId_stockId: { userId: user.id, stockId: stock.id } },
          })
          .then(Boolean)
      : Promise.resolve(false),
    getStockHistory(stock.id, "1D"),
    getSeriesPeers(stock.seriesSlug, stock.ticker),
  ]);

  const shares = holding?.shares ?? 0;
  const avgCost = holding?.avgCost ?? 0;
  const positionValue = shares * stock.price;
  const positionCost = shares * avgCost;
  const pnl = positionValue - positionCost;
  const pnlPct = positionCost > 0 ? (pnl / positionCost) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/market" className="hover:text-white">
          Market
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/category/${stock.categorySlug}`}
          className="hover:text-white"
        >
          {stock.categoryName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-300">{stock.seriesName}</span>
      </nav>

      {/* Header */}
      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar emoji={stock.emoji} gradient={stock.gradient} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">{stock.name}</h1>
              <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-sm text-zinc-300">
                {stock.ticker}
              </span>
            </div>
            <p className="mt-1 max-w-md text-sm text-zinc-400">{stock.blurb}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-3xl font-bold text-white">
                {formatMoney(stock.price)}
              </span>
              <ChangeBadge value={stock.change24h} size="md" />
              <span className="text-xs text-zinc-500">24h</span>
            </div>
          </div>
        </div>
        <WatchButton
          ticker={stock.ticker}
          initialWatching={watching}
          isAuthed={!!user}
        />
      </div>

      {/* Main grid */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PriceChart
            ticker={stock.ticker}
            initialHistory={history}
            currentPrice={stock.price}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Market cap" value={formatCompact(stock.marketCap)} />
            <Stat
              label="Held by traders"
              value={formatNumber(stock.sharesHeld) + " sh"}
            />
            <Stat label="Float" value={formatNumber(stock.floatShares) + " sh"} />
            <Stat label="IPO price" value={formatMoney(stock.basePrice)} />
            <Stat
              label="vs IPO"
              value={formatPercent(
                ((stock.price - stock.basePrice) / stock.basePrice) * 100,
              )}
            />
            <Stat label="24h change" value={formatPercent(stock.change24h)} />
          </div>

          {/* About */}
          <div className="card p-5">
            <h3 className="font-semibold text-white">About {stock.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {stock.blurb} {stock.name} trades on {stock.categoryName} under{" "}
              <Link
                href={`/category/${stock.categorySlug}`}
                className="text-violet-300 hover:text-violet-200"
              >
                {stock.seriesName}
              </Link>
              . The price climbs as traders buy and falls as they sell.
            </p>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <TradePanel
            ticker={stock.ticker}
            price={stock.price}
            liquidity={stock.liquidity}
            isAuthed={!!user}
            cashBalance={user?.cashBalance ?? 0}
            sharesOwned={shares}
          />

          {shares > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 font-semibold text-white">Your position</h3>
              <div className="space-y-2 text-sm">
                <PosRow label="Shares" value={formatNumber(shares)} />
                <PosRow label="Avg cost" value={formatMoney(avgCost)} />
                <PosRow label="Market value" value={formatMoney(positionValue)} />
                <div className="my-2 h-px bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total return</span>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      pnl >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatSignedMoney(pnl)} ({formatPercent(pnlPct)})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Peers */}
      {peers.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold text-white">
            More from {stock.seriesEmoji} {stock.seriesName}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {peers.map((s) => (
              <StockCard key={s.id} stock={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="label">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function PosRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono text-zinc-100">{value}</span>
    </div>
  );
}
