import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Star } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStockViewsByIds } from "@/lib/queries";
import { StockCard } from "@/components/StockCard";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const user = await requireUser();

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { stockId: true },
  });
  const views = await getStockViewsByIds(items.map((i) => i.stockId));
  // preserve watchlist order (most recently added first)
  const order = new Map(items.map((i, idx) => [i.stockId, idx]));
  views.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6 text-amber-300" />
        <h1 className="text-3xl font-bold text-white">Watchlist</h1>
      </div>
      <p className="mt-1 text-zinc-400">Characters you’re keeping an eye on.</p>

      {views.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
          <Star className="h-10 w-10 text-zinc-600" />
          <div className="text-lg font-semibold text-white">
            Your watchlist is empty
          </div>
          <p className="max-w-sm text-sm text-zinc-400">
            Tap the “Watch” button on any character to track its price here.
          </p>
          <Link href="/market" className="btn-primary mt-1">
            Explore the market <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {views.map((s) => (
            <StockCard key={s.id} stock={s} />
          ))}
        </div>
      )}
    </div>
  );
}
