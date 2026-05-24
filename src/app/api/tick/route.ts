import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maybeTickMarket } from "@/lib/market";

export const dynamic = "force-dynamic";

// Advances the ambient market (throttled) and returns a lightweight ticker tape.
// Called periodically by the client heartbeat so prices stay alive.
export async function GET() {
  const ticked = await maybeTickMarket();
  const stocks = await prisma.stock.findMany({
    select: { ticker: true, emoji: true, price: true, basePrice: true },
    orderBy: { floatShares: "desc" },
  });
  const tape = stocks.map((s) => ({
    ticker: s.ticker,
    emoji: s.emoji,
    price: s.price,
    change: s.basePrice > 0 ? ((s.price - s.basePrice) / s.basePrice) * 100 : 0,
  }));
  return NextResponse.json({ ticked, tape });
}
