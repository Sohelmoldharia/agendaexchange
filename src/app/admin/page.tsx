import Link from "next/link";
import { ArrowRight, Layers, ScrollText, Sparkles, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatCompact, formatMoney, formatNumber } from "@/lib/format";

export default async function AdminDashboard() {
  const [
    stockCount,
    categoryCount,
    seriesCount,
    userCount,
    orderCount,
    totalVolumeAgg,
    cashAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.stock.count(),
    prisma.category.count(),
    prisma.series.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.stock.aggregate({ _sum: { volume: true } }),
    prisma.user.aggregate({ _sum: { cashBalance: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
        stock: { select: { ticker: true, name: true } },
      },
    }),
  ]);

  const cards = [
    { label: "Stocks", value: formatNumber(stockCount), href: "/admin/stocks", Icon: TrendingUp },
    { label: "Categories", value: formatNumber(categoryCount), href: "/admin/categories", Icon: Sparkles },
    { label: "Series", value: formatNumber(seriesCount), href: "/admin/series", Icon: Layers },
    { label: "Users", value: formatNumber(userCount), href: "/admin/users", Icon: Users },
    { label: "Orders", value: formatNumber(orderCount), href: "/admin/orders", Icon: ScrollText },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card card-hover group flex flex-col gap-2 p-4"
          >
            <div className="flex items-center justify-between text-zinc-500">
              <c.Icon className="h-4 w-4" />
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="font-mono text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-zinc-500">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-white">Market snapshot</h2>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Total lifetime volume" value={formatCompact(totalVolumeAgg._sum.volume ?? 0)} />
            <Row label="Cash across all users" value={formatMoney(cashAgg._sum.cashBalance ?? 0)} />
            <Row label="Avg cash per user" value={formatMoney((cashAgg._sum.cashBalance ?? 0) / Math.max(1, userCount))} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Latest trades</h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
              View all →
            </Link>
          </div>
          <div className="mt-3 divide-y divide-white/5 text-sm">
            {recentOrders.length === 0 && (
              <p className="py-2 text-zinc-500">No trades yet.</p>
            )}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 py-2">
                <span className="truncate text-zinc-300">
                  <span
                    className={cn(
                      "font-semibold",
                      o.side === "BUY" ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {o.side === "BUY" ? "Bought" : "Sold"}
                  </span>{" "}
                  {formatNumber(o.shares)} {o.stock.ticker}
                </span>
                <span className="shrink-0 text-xs text-zinc-500">
                  @{o.user.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono font-semibold text-zinc-100">{value}</span>
    </div>
  );
}
