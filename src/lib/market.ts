import { prisma } from "./prisma";
import { MIN_PRICE, round2 } from "./pricing";

// Ambient market simulation: every tick each stock takes a small mean-reverting
// random step so prices feel alive even without user trades. Triggered by a
// client heartbeat hitting /api/tick; throttled here so many pollers don't
// over-advance the market.

const TICK_INTERVAL_MS = 10_000;

const g = globalThis as unknown as { __fandxLastTick?: number };

function meanRevertingDrift(price: number, basePrice: number): number {
  const reversion = 0.025 * ((basePrice - price) / basePrice);
  const noise = (Math.random() * 2 - 1) * 0.013;
  return reversion + noise;
}

export async function maybeTickMarket(): Promise<boolean> {
  const now = Date.now();
  if (g.__fandxLastTick && now - g.__fandxLastTick < TICK_INTERVAL_MS) {
    return false;
  }
  g.__fandxLastTick = now;
  await tickMarket();
  return true;
}

export async function tickMarket(): Promise<void> {
  const stocks = await prisma.stock.findMany({
    select: { id: true, price: true, basePrice: true },
  });
  if (stocks.length === 0) return;

  const ts = new Date();
  const ops = stocks.flatMap((s) => {
    const drift = meanRevertingDrift(s.price, s.basePrice);
    const newPrice = Math.max(MIN_PRICE, round2(s.price * (1 + drift)));
    return [
      prisma.stock.update({ where: { id: s.id }, data: { price: newPrice } }),
      prisma.pricePoint.create({
        data: { stockId: s.id, price: newPrice, timestamp: ts },
      }),
    ];
  });
  await prisma.$transaction(ops);
}

export type SeriesPoint = { t: number; p: number };

// Fetch recent price history for many stocks in one query, grouped by stock.
export async function getSeriesForStocks(
  stockIds: string[],
  sinceMs: number,
): Promise<Map<string, SeriesPoint[]>> {
  const map = new Map<string, SeriesPoint[]>();
  if (stockIds.length === 0) return map;
  const points = await prisma.pricePoint.findMany({
    where: { stockId: { in: stockIds }, timestamp: { gte: new Date(sinceMs) } },
    orderBy: { timestamp: "asc" },
    select: { stockId: true, price: true, timestamp: true },
  });
  for (const pt of points) {
    const arr = map.get(pt.stockId) ?? [];
    arr.push({ t: pt.timestamp.getTime(), p: pt.price });
    map.set(pt.stockId, arr);
  }
  return map;
}

// % change of a stock over a window, computed from its first point in-window.
export function changePctFromSeries(
  current: number,
  series: SeriesPoint[] | undefined,
): number {
  if (!series || series.length === 0) return 0;
  const first = series[0].p;
  if (first <= 0) return 0;
  return ((current - first) / first) * 100;
}
