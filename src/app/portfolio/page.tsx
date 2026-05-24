import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStockViewsByIds, type StockView } from "@/lib/queries";
import {
  cn,
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  formatSignedMoney,
} from "@/lib/format";
import { Avatar } from "@/components/Avatar";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await requireUser();

  const holdings = await prisma.holding.findMany({
    where: { userId: user.id, shares: { gt: 0 } },
  });
  const views = await getStockViewsByIds(holdings.map((h) => h.stockId));
  const viewMap = new Map<string, StockView>(views.map((v) => [v.id, v]));

  const rows = holdings
    .map((h) => {
      const v = viewMap.get(h.stockId)!;
      const value = h.shares * v.price;
      const cost = h.shares * h.avgCost;
      const pnl = value - cost;
      return {
        v,
        shares: h.shares,
        avgCost: h.avgCost,
        value,
        cost,
        pnl,
        pnlPct: cost > 0 ? (pnl / cost) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const invested = rows.reduce((s, r) => s + r.cost, 0);
  const marketValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPnl = marketValue - invested;
  const netWorth = user.cashBalance + marketValue;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      stock: { select: { ticker: true, name: true, emoji: true, gradient: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="mt-1 text-zinc-400">@{user.username}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Net worth" value={formatMoney(netWorth)} accent />
        <Summary label="Cash" value={formatMoney(user.cashBalance)} />
        <Summary label="Invested value" value={formatMoney(marketValue)} />
        <Summary
          label="Unrealized P&L"
          value={`${formatSignedMoney(totalPnl)}`}
          tone={totalPnl >= 0 ? "up" : "down"}
          sub={invested > 0 ? formatPercent((totalPnl / invested) * 100) : undefined}
        />
      </div>

      {/* Holdings */}
      <h2 className="mb-3 mt-10 text-xl font-bold text-white">Holdings</h2>
      {rows.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          body="Buy your first character to start building a portfolio."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">24h</th>
                <th className="px-4 py-3 text-right font-medium">Shares</th>
                <th className="px-4 py-3 text-right font-medium">Avg cost</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.v.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${r.v.ticker}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar emoji={r.v.emoji} gradient={r.v.gradient} size="sm" />
                      <div>
                        <div className="font-medium text-zinc-100">{r.v.name}</div>
                        <div className="font-mono text-xs text-zinc-500">
                          {r.v.ticker}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-100">
                    {formatMoney(r.v.price)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      r.v.change24h >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatPercent(r.v.change24h)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-100">
                    {formatNumber(r.shares)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {formatMoney(r.avgCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-100">
                    {formatMoney(r.value)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono font-semibold",
                      r.pnl >= 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {formatSignedMoney(r.pnl)}
                    <span className="block text-xs font-normal">
                      {formatPercent(r.pnlPct)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent activity */}
      <h2 className="mb-3 mt-10 text-xl font-bold text-white">Recent activity</h2>
      {orders.length === 0 ? (
        <EmptyState title="No trades yet" body="Your order history will show up here." />
      ) : (
        <div className="card divide-y divide-white/5">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/stock/${o.stock.ticker}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <Avatar emoji={o.stock.emoji} gradient={o.stock.gradient} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-zinc-100">
                  <span
                    className={cn(
                      "font-semibold",
                      o.side === "BUY" ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {o.side === "BUY" ? "Bought" : "Sold"}
                  </span>{" "}
                  {formatNumber(o.shares)} {o.stock.ticker}
                </div>
                <div className="text-xs text-zinc-500">
                  {new Date(o.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  @ {formatMoney(o.price)}
                </div>
              </div>
              <div className="font-mono text-sm text-zinc-100">
                {formatCompact(o.total)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Summary({
  label,
  value,
  sub,
  tone,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
  accent?: boolean;
}) {
  return (
    <div className={cn("card p-5", accent && "ring-1 ring-violet-500/30")}>
      <div className="label">{label}</div>
      <div
        className={cn(
          "mt-1.5 font-mono text-2xl font-bold",
          tone === "up"
            ? "text-emerald-400"
            : tone === "down"
              ? "text-rose-400"
              : "text-white",
        )}
      >
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            "mt-0.5 font-mono text-sm",
            tone === "up" ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="max-w-sm text-sm text-zinc-400">{body}</p>
      <Link href="/market" className="btn-primary mt-1">
        Explore the market <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
