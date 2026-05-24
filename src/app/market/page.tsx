import type { Metadata } from "next";
import { getAllStockViews, getCategoryViews } from "@/lib/queries";
import { MarketBrowser } from "@/components/MarketBrowser";

export const metadata: Metadata = {
  title: "Market",
  description: "Browse and trade every character on the exchange.",
};

export default async function MarketPage() {
  const [stocks, categories] = await Promise.all([
    getAllStockViews(),
    getCategoryViews(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Market</h1>
        <p className="mt-1 text-zinc-400">
          Every character on the exchange. Prices move as people trade.
        </p>
      </div>
      <MarketBrowser stocks={stocks} categories={categories} />
    </div>
  );
}
