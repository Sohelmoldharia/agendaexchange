import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CategoryView } from "@/lib/queries";
import { cn } from "@/lib/format";

export function CategoryCard({ category }: { category: CategoryView }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="card card-hover group relative overflow-hidden p-5"
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-25 blur-2xl transition-opacity group-hover:opacity-40",
          category.gradient,
        )}
      />
      <div className="flex items-start justify-between">
        <span className="text-4xl">{category.emoji}</span>
        <ArrowUpRight className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-white" />
      </div>
      <h3 className="mt-3 text-lg font-bold text-white">{category.name}</h3>
      <p className="mt-0.5 text-sm text-zinc-400">{category.blurb}</p>
      <div className="mt-4 flex gap-2 text-xs text-zinc-500">
        <span className="chip">{category.stockCount} stocks</span>
        <span className="chip">{category.seriesCount} series</span>
      </div>
    </Link>
  );
}
