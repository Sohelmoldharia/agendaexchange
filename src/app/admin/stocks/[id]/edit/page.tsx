import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StockForm } from "@/components/admin/StockForm";
import { updateStock } from "../../../actions";

export default async function EditStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stock, series] = await Promise.all([
    prisma.stock.findUnique({ where: { id } }),
    prisma.series.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
      include: { category: { select: { name: true } } },
    }),
  ]);
  if (!stock) notFound();

  const options = series.map((s) => ({
    id: s.id,
    name: s.name,
    categoryName: s.category.name,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Edit {stock.name}</h2>
        <p className="font-mono text-sm text-zinc-500">{stock.ticker}</p>
      </div>
      <StockForm
        action={updateStock.bind(null, stock.id)}
        series={options}
        values={{
          name: stock.name,
          ticker: stock.ticker,
          blurb: stock.blurb,
          emoji: stock.emoji,
          gradient: stock.gradient,
          price: stock.price,
          basePrice: stock.basePrice,
          liquidity: stock.liquidity,
          floatShares: stock.floatShares,
          seriesId: stock.seriesId,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
