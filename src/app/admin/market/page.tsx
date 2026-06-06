import {
  ArrowDownToLine,
  Coins,
  Eraser,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatMoney, formatNumber } from "@/lib/format";
import {
  giveAllUsersCash,
  resetAllPrices,
  runMarketTick,
  wipeAllOrders,
} from "../actions";
import { Field } from "@/components/admin/Field";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export default async function AdminMarketPage() {
  const [stockCount, userCount, orderCount, biggestSpreads] = await Promise.all([
    prisma.stock.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.stock.findMany({
      select: {
        ticker: true,
        name: true,
        price: true,
        basePrice: true,
      },
    }),
  ]);

  const movers = biggestSpreads
    .map((s) => ({
      ...s,
      drift:
        s.basePrice > 0 ? ((s.price - s.basePrice) / s.basePrice) * 100 : 0,
    }))
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Market controls</h2>
        <p className="text-sm text-zinc-500">
          One-click utilities that affect every user on the exchange. Use with
          intent.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={runMarketTick} className="card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-violet-300">
            <PlayCircle className="h-4 w-4" />
            <h3 className="font-semibold text-white">Run a market tick</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Advance every stock by one ambient step right now. Bypasses the
            10-second throttle.
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {formatNumber(stockCount)} stocks will move
            </span>
            <ConfirmSubmit className="btn-primary">Tick now</ConfirmSubmit>
          </div>
        </form>

        <form action={resetAllPrices} className="card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-amber-300">
            <RefreshCw className="h-4 w-4" />
            <h3 className="font-semibold text-white">Reset all prices</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Force every character&apos;s price back to its IPO base. Holdings
            keep their shares; market cap snaps to base.
          </p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {formatNumber(stockCount)} stocks affected
            </span>
            <ConfirmSubmit
              confirm="Reset every stock's price to base? Active positions will be re-valued."
              className="btn-ghost"
            >
              Reset all to base
            </ConfirmSubmit>
          </div>
        </form>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={giveAllUsersCash} className="card space-y-3 p-5">
          <div className="flex items-center gap-2 text-emerald-300">
            <Coins className="h-4 w-4" />
            <h3 className="font-semibold text-white">Bonus cash for everyone</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Add the same amount of play money to every user&apos;s balance.
          </p>
          <div className="flex items-end gap-3">
            <Field label="Amount">
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={1000}
                className="input w-36 font-mono"
              />
            </Field>
            <ConfirmSubmit
              confirm="Add cash to every user?"
              className="btn-primary"
            >
              Give to {formatNumber(userCount)} users
            </ConfirmSubmit>
          </div>
        </form>

        <form action={wipeAllOrders} className="card space-y-3 p-5">
          <div className="flex items-center gap-2 text-rose-300">
            <Eraser className="h-4 w-4" />
            <h3 className="font-semibold text-white">Wipe order history</h3>
          </div>
          <p className="text-sm text-zinc-400">
            Delete every record from the orders table. Holdings, cash, and
            stocks stay untouched.
          </p>
          <div className="flex items-end gap-3">
            <Field label="Type WIPE to confirm">
              <input
                name="confirm"
                required
                className="input w-36 font-mono"
                placeholder="WIPE"
              />
            </Field>
            <ConfirmSubmit
              confirm="Delete all order history? Cannot be undone."
              className="btn-down"
            >
              Delete {formatNumber(orderCount)} orders
            </ConfirmSubmit>
          </div>
        </form>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-zinc-500" />
          <h3 className="font-semibold text-white">Biggest movers vs IPO</h3>
        </div>
        <div className="mt-3 divide-y divide-white/5 text-sm">
          {movers.map((m) => (
            <div
              key={m.ticker}
              className="flex items-center justify-between py-2"
            >
              <div>
                <span className="font-medium text-zinc-100">{m.name}</span>{" "}
                <span className="font-mono text-xs text-zinc-500">
                  {m.ticker}
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono text-zinc-200">
                  {formatMoney(m.price)}{" "}
                  <span className="text-xs text-zinc-500">
                    base {formatMoney(m.basePrice)}
                  </span>
                </div>
                <div
                  className={cn(
                    "font-mono text-xs font-semibold",
                    m.drift >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {m.drift >= 0 ? "+" : ""}
                  {m.drift.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
