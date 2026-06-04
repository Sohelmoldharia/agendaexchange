import { prisma } from "@/lib/prisma";
import { SeriesForm } from "@/components/admin/SeriesForm";
import { createSeries } from "../../actions";

export default async function NewSeriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, emoji: true },
  });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">New series</h2>
        <p className="text-sm text-zinc-500">Group characters under a parent fandom.</p>
      </div>
      <SeriesForm action={createSeries} categories={categories} submitLabel="Create series" />
    </div>
  );
}
