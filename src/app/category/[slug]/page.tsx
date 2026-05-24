import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import {
  getCategoryBySlug,
  getStockViewsByCategory,
  type StockView,
} from "@/lib/queries";
import { cn } from "@/lib/format";
import { StockCard } from "@/components/StockCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? category.name : "Category" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, stocks] = await Promise.all([
    getCategoryBySlug(slug),
    getStockViewsByCategory(slug),
  ]);
  if (!category) notFound();

  // group stocks by series
  const groups = new Map<
    string,
    { name: string; emoji: string; stocks: StockView[] }
  >();
  for (const s of stocks) {
    const g = groups.get(s.seriesSlug) ?? {
      name: s.seriesName,
      emoji: s.seriesEmoji,
      stocks: [],
    };
    g.stocks.push(s);
    groups.set(s.seriesSlug, g);
  }
  const series = [...groups.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/market" className="hover:text-white">
          Market
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-300">{category.name}</span>
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <div
          className={cn(
            "grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-4xl shadow-lg",
            category.gradient,
          )}
        >
          {category.emoji}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{category.name}</h1>
          <p className="text-zinc-400">{category.blurb}</p>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {series.map((g) => (
          <section key={g.name}>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <span className="text-2xl">{g.emoji}</span>
              {g.name}
              <span className="text-sm font-normal text-zinc-500">
                {g.stocks.length} characters
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.stocks.map((s) => (
                <StockCard key={s.id} stock={s} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
