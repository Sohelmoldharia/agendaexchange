import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatCompact, formatMoney, formatNumber } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteStock } from "../actions";

export default async function AdminStocksPage() {
  const stocks = await prisma.stock.findMany({
    orderBy: [{ series: { category: { sortOrder: "asc" } } }, { name: "asc" }],
    include: { series: { include: { category: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Stocks</h2>
          <p className="text-sm text-zinc-500">
            {stocks.length} characters on the exchange.
          </p>
        </div>
        <Link href="/admin/stocks/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New stock
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Character</th>
              <th className="px-4 py-3 font-medium">Fandom · Series</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Base</th>
              <th className="px-4 py-3 text-right font-medium">Liquidity</th>
              <th className="px-4 py-3 text-right font-medium">Cap</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stocks.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar emoji={s.emoji} gradient={s.gradient} size="sm" />
                    <div>
                      <div className="font-medium text-zinc-100">{s.name}</div>
                      <div className="font-mono text-xs text-zinc-500">{s.ticker}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  <span className={cn("rounded-md bg-gradient-to-br px-1.5 py-0.5 text-white", s.series.category.gradient)}>
                    {s.series.category.emoji}
                  </span>{" "}
                  {s.series.category.name} · {s.series.name}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100">{formatMoney(s.price)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatMoney(s.basePrice)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">{formatNumber(s.liquidity)}</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                  {formatCompact(s.price * s.floatShares)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/stocks/${s.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-white/25 hover:bg-white/[0.07]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <DeleteButton
                      small
                      action={deleteStock.bind(null, s.id)}
                      confirmText={`Delete ${s.name}? Holdings and history for this stock will be wiped.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
