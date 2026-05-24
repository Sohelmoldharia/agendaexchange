import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStockHistory, type RangeKey } from "@/lib/queries";
import { changePctFromSeries } from "@/lib/market";

export const dynamic = "force-dynamic";

const RANGES: RangeKey[] = ["1D", "1W", "1M", "ALL"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const url = new URL(req.url);
  const rangeParam = url.searchParams.get("range") as RangeKey | null;
  const range: RangeKey =
    rangeParam && RANGES.includes(rangeParam) ? rangeParam : "1D";

  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    select: { id: true, price: true },
  });
  if (!stock) {
    return NextResponse.json({ error: "Stock not found." }, { status: 404 });
  }

  const history = await getStockHistory(stock.id, range);
  return NextResponse.json({
    price: stock.price,
    range,
    change: changePctFromSeries(stock.price, history),
    history,
  });
}
