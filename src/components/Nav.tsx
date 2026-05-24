import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "./TopBar";

export async function Nav() {
  const user = await getCurrentUser();
  const stocks = await prisma.stock.findMany({
    select: {
      ticker: true,
      name: true,
      emoji: true,
      gradient: true,
      series: { select: { name: true, category: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });
  const items = stocks.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    emoji: s.emoji,
    gradient: s.gradient,
    seriesName: s.series.name,
    categoryName: s.series.category.name,
  }));
  return (
    <TopBar
      user={
        user ? { username: user.username, cashBalance: user.cashBalance } : null
      }
      items={items}
    />
  );
}
