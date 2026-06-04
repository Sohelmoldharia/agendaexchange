import { Save, Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn, formatCompact, formatNumber } from "@/lib/format";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteUser, updateUser } from "../actions";

export default async function AdminUsersPage() {
  const [me, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        holdings: { include: { stock: { select: { price: true } } } },
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Users</h2>
        <p className="text-sm text-zinc-500">{users.length} accounts on the exchange.</p>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const portfolio = u.holdings.reduce(
            (s, h) => s + h.shares * h.stock.price,
            0,
          );
          const netWorth = u.cashBalance + portfolio;
          const isMe = me?.id === u.id;
          return (
            <form
              key={u.id}
              action={updateUser.bind(null, u.id)}
              className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-bold text-white">
                  {u.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-white">@{u.username}</span>
                    {u.isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    )}
                    {isMe && (
                      <span className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                        You
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-zinc-500">{u.email}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Net worth{" "}
                    <span className="font-mono text-zinc-300">{formatCompact(netWorth)}</span>
                    {" · "}
                    {formatNumber(u._count.orders)} trades
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="label mb-1 block">Cash</span>
                  <input
                    name="cashBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={u.cashBalance}
                    className="input w-36 font-mono"
                  />
                </label>
                <label
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-zinc-200",
                    isMe && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    name="isAdmin"
                    defaultChecked={u.isAdmin}
                    disabled={isMe}
                    className="h-4 w-4 accent-amber-400"
                  />
                  Admin
                </label>
                <button type="submit" className="btn-primary">
                  <Save className="h-4 w-4" /> Save
                </button>
                {!isMe && (
                  <DeleteButton
                    action={deleteUser.bind(null, u.id)}
                    confirmText={`Delete @${u.username}? All their holdings, trades, and watchlist will be wiped.`}
                  />
                )}
              </div>
            </form>
          );
        })}
      </div>
    </div>
  );
}
