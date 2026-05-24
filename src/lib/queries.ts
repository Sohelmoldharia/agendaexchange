import { prisma } from "./prisma";
import {
  getSeriesForStocks,
  changePctFromSeries,
  type SeriesPoint,
} from "./market";

export type StockView = {
  id: string;
  name: string;
  ticker: string;
  slug: string;
  blurb: string;
  emoji: string;
  gradient: string;
  price: number;
  basePrice: number;
  liquidity: number;
  floatShares: number;
  sharesHeld: number;
  marketCap: number;
  change24h: number;
  spark: number[];
  seriesName: string;
  seriesSlug: string;
  seriesEmoji: string;
  categoryName: string;
  categorySlug: string;
  categoryEmoji: string;
  categoryGradient: string;
};

type StockWithRels = {
  id: string;
  name: string;
  ticker: string;
  slug: string;
  blurb: string;
  emoji: string;
  gradient: string;
  price: number;
  basePrice: number;
  liquidity: number;
  floatShares: number;
  sharesHeld: number;
  series: {
    name: string;
    slug: string;
    emoji: string;
    category: {
      name: string;
      slug: string;
      emoji: string;
      gradient: string;
    };
  };
};

const stockInclude = {
  series: { include: { category: true } },
} as const;

export function downsample(points: number[], target: number): number[] {
  if (points.length <= target) return points;
  const step = (points.length - 1) / (target - 1);
  const out: number[] = [];
  for (let i = 0; i < target; i++) out.push(points[Math.round(i * step)]);
  return out;
}

function toView(
  s: StockWithRels,
  series: SeriesPoint[] | undefined,
): StockView {
  const prices = series?.map((p) => p.p) ?? [];
  return {
    id: s.id,
    name: s.name,
    ticker: s.ticker,
    slug: s.slug,
    blurb: s.blurb,
    emoji: s.emoji,
    gradient: s.gradient,
    price: s.price,
    basePrice: s.basePrice,
    liquidity: s.liquidity,
    floatShares: s.floatShares,
    sharesHeld: s.sharesHeld,
    marketCap: s.price * s.floatShares,
    change24h: changePctFromSeries(s.price, series),
    spark: downsample(prices.length ? prices : [s.price, s.price], 24),
    seriesName: s.series.name,
    seriesSlug: s.series.slug,
    seriesEmoji: s.series.emoji,
    categoryName: s.series.category.name,
    categorySlug: s.series.category.slug,
    categoryEmoji: s.series.category.emoji,
    categoryGradient: s.series.category.gradient,
  };
}

async function buildViews(stocks: StockWithRels[]): Promise<StockView[]> {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const seriesMap = await getSeriesForStocks(
    stocks.map((s) => s.id),
    since,
  );
  return stocks.map((s) => toView(s, seriesMap.get(s.id)));
}

export async function getAllStockViews(): Promise<StockView[]> {
  const stocks = await prisma.stock.findMany({
    include: stockInclude,
    orderBy: { name: "asc" },
  });
  return buildViews(stocks);
}

export async function getStockViewByTicker(
  ticker: string,
): Promise<StockView | null> {
  const stock = await prisma.stock.findUnique({
    where: { ticker: ticker.toUpperCase() },
    include: stockInclude,
  });
  if (!stock) return null;
  const [view] = await buildViews([stock]);
  return view;
}

export async function getStockViewsByCategory(
  slug: string,
): Promise<StockView[]> {
  const stocks = await prisma.stock.findMany({
    where: { series: { category: { slug } } },
    include: stockInclude,
    orderBy: { name: "asc" },
  });
  return buildViews(stocks);
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getSeriesPeers(
  seriesSlug: string,
  excludeTicker: string,
): Promise<StockView[]> {
  const stocks = await prisma.stock.findMany({
    where: { series: { slug: seriesSlug }, NOT: { ticker: excludeTicker } },
    include: stockInclude,
    orderBy: { name: "asc" },
  });
  return buildViews(stocks);
}

export async function getStockViewsByIds(ids: string[]): Promise<StockView[]> {
  if (ids.length === 0) return [];
  const stocks = await prisma.stock.findMany({
    where: { id: { in: ids } },
    include: stockInclude,
  });
  return buildViews(stocks);
}

export type CategoryView = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  gradient: string;
  blurb: string;
  seriesCount: number;
  stockCount: number;
};

export async function getCategoryViews(): Promise<CategoryView[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      series: { include: { _count: { select: { stocks: true } } } },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    emoji: c.emoji,
    gradient: c.gradient,
    blurb: c.blurb,
    seriesCount: c.series.length,
    stockCount: c.series.reduce((acc, s) => acc + s._count.stocks, 0),
  }));
}

export type TapeItem = {
  ticker: string;
  emoji: string;
  price: number;
  change: number;
};

export async function getTapeData(): Promise<TapeItem[]> {
  const stocks = await prisma.stock.findMany({
    select: { ticker: true, emoji: true, price: true, basePrice: true },
    orderBy: { floatShares: "desc" },
  });
  return stocks.map((s) => ({
    ticker: s.ticker,
    emoji: s.emoji,
    price: s.price,
    change: s.basePrice > 0 ? ((s.price - s.basePrice) / s.basePrice) * 100 : 0,
  }));
}

export type RangeKey = "1D" | "1W" | "1M" | "ALL";

const RANGE_MS: Record<RangeKey, number> = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  ALL: 365 * 24 * 60 * 60 * 1000,
};

export async function getStockHistory(
  stockId: string,
  range: RangeKey,
): Promise<SeriesPoint[]> {
  const since = new Date(Date.now() - RANGE_MS[range]);
  const points = await prisma.pricePoint.findMany({
    where: { stockId, timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
    select: { price: true, timestamp: true },
  });
  const mapped = points.map((p) => ({ t: p.timestamp.getTime(), p: p.price }));
  // cap points so charts stay light
  if (mapped.length <= 220) return mapped;
  const step = (mapped.length - 1) / 219;
  const out: SeriesPoint[] = [];
  for (let i = 0; i < 220; i++) out.push(mapped[Math.round(i * step)]);
  return out;
}
