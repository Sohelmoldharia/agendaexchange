import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import {
  cn,
  formatCompact,
  formatMoney,
  formatNumber,
} from "@/lib/format";

const PAGE_SIZE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      take: PAGE_SIZE,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true } },
        stock: {
          select: { name: true, ticker: true, emoji: true, gradient: true },
        },
      },
    }),
    prisma.order.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Orders</h2>
        <p className="text-sm text-zinc-500">
          {formatNumber(total)} trades total. Showing page {page} of{" "}
          {totalPages}.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 text-right font-medium">Shares</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No trades yet. Buy or sell a character to see it here.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {new Date(o.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-zinc-300">@{o.user.username}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      emoji={o.stock.emoji}
                      gradient={o.stock.gradient}
                      size="sm"
                    />
                    <div>
                      <div className="text-zinc-100">{o.stock.name}</div>
                      <div className="font-mono text-xs text-zinc-500">
                        {o.stock.ticker}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-bold",
                      o.side === "BUY"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300",
                    )}
                  >
                    {o.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100">
                  {formatNumber(o.shares)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                  {formatMoney(o.price)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100">
                  {formatCompact(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/admin/orders?page=${Math.max(1, page - 1)}`}
              aria-disabled={page === 1}
              className={cn(
                "btn-ghost",
                page === 1 && "pointer-events-none opacity-40",
              )}
            >
              <ChevronLeft className="h-4 w-4" /> Newer
            </Link>
            <Link
              href={`/admin/orders?page=${Math.min(totalPages, page + 1)}`}
              aria-disabled={page === totalPages}
              className={cn(
                "btn-ghost",
                page === totalPages && "pointer-events-none opacity-40",
              )}
            >
              Older <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
