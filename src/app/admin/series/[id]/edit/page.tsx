import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeriesForm } from "@/components/admin/SeriesForm";
import { updateSeries } from "../../../actions";

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [series, categories] = await Promise.all([
    prisma.series.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
  ]);
  if (!series) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Edit {series.name}</h2>
      </div>
      <SeriesForm
        action={updateSeries.bind(null, series.id)}
        categories={categories}
        values={{
          name: series.name,
          emoji: series.emoji,
          blurb: series.blurb,
          categoryId: series.categoryId,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
