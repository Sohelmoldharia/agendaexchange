import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatNumber } from "@/lib/format";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteCategory } from "../actions";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      series: { include: { _count: { select: { stocks: true } } } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Categories</h2>
          <p className="text-sm text-zinc-500">{categories.length} fandoms.</p>
        </div>
        <Link href="/admin/categories/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New category
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((c) => {
          const stockCount = c.series.reduce((s, x) => s + x._count.stocks, 0);
          return (
            <div key={c.id} className="card relative overflow-hidden p-5">
              <div
                className={cn(
                  "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-25 blur-2xl",
                  c.gradient,
                )}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg",
                      c.gradient,
                    )}
                  >
                    {c.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {formatNumber(c.series.length)} series · {formatNumber(stockCount)} characters
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/categories/${c.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-white/25 hover:bg-white/[0.07]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <DeleteButton
                    small
                    action={deleteCategory.bind(null, c.id)}
                    confirmText={`Delete ${c.name}? Its ${stockCount} characters and ${c.series.length} series will be deleted too.`}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400">{c.blurb}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
