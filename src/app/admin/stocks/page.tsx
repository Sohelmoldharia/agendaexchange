import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  StocksTable,
  type AdminStockRow,
  type CategoryOption,
} from "@/components/admin/StocksTable";
import { deleteStock, updateStockQuick } from "../actions";

export default async function AdminStocksPage() {
  const [stocks, categories] = await Promise.all([
    prisma.stock.findMany({
      orderBy: [{ series: { category: { sortOrder: "asc" } } }, { name: "asc" }],
      include: { series: { include: { category: true } } },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, emoji: true },
    }),
  ]);

  const rows: AdminStockRow[] = stocks.map((s) => ({
    id: s.id,
    name: s.name,
    ticker: s.ticker,
    emoji: s.emoji,
    gradient: s.gradient,
    price: s.price,
    basePrice: s.basePrice,
    liquidity: s.liquidity,
    floatShares: s.floatShares,
    seriesName: s.series.name,
    categoryName: s.series.category.name,
    categorySlug: s.series.category.slug,
    categoryEmoji: s.series.category.emoji,
  }));

  const cats: CategoryOption[] = categories;

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

      <StocksTable
        stocks={rows}
        categories={cats}
        actions={{ updateQuick: updateStockQuick, delete: deleteStock }}
      />
    </div>
  );
}
