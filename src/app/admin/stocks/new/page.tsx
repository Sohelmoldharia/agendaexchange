import { prisma } from "@/lib/prisma";
import { StockForm } from "@/components/admin/StockForm";
import { createStock } from "../../actions";

export default async function NewStockPage() {
  const series = await prisma.series.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: { category: { select: { name: true } } },
  });
  const options = series.map((s) => ({
    id: s.id,
    name: s.name,
    categoryName: s.category.name,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">New stock</h2>
        <p className="text-sm text-zinc-500">List a new character on the exchange.</p>
      </div>
      <StockForm action={createStock} series={options} submitLabel="Create stock" />
    </div>
  );
}
