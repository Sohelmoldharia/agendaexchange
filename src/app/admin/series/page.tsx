import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatNumber } from "@/lib/format";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteSeries } from "../actions";

export default async function AdminSeriesPage() {
  const series = await prisma.series.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: {
      category: true,
      _count: { select: { stocks: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Series</h2>
          <p className="text-sm text-zinc-500">{series.length} series across all fandoms.</p>
        </div>
        <Link href="/admin/series/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New series
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Series</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Characters</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {series.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <div className="font-medium text-zinc-100">{s.name}</div>
                      <div className="text-xs text-zinc-500">{s.blurb}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  <span className={cn("rounded-md bg-gradient-to-br px-1.5 py-0.5 text-white", s.category.gradient)}>
                    {s.category.emoji}
                  </span>{" "}
                  {s.category.name}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-100">
                  {formatNumber(s._count.stocks)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/series/${s.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-white/25 hover:bg-white/[0.07]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <DeleteButton
                      small
                      action={deleteSeries.bind(null, s.id)}
                      confirmText={`Delete ${s.name}? Its ${s._count.stocks} characters will be deleted too.`}
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
