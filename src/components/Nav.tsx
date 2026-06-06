import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "./TopBar";

export async function Nav() {
  let user = null;
  let items: {
    ticker: string;
    name: string;
    emoji: string;
    gradient: string;
    seriesName: string;
    categoryName: string;
  }[] = [];
  try {
    user = await getCurrentUser();
    const stocks = await prisma.stock.findMany({
      select: {
        ticker: true,
        name: true,
        emoji: true,
        gradient: true,
        series: {
          select: { name: true, category: { select: { name: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
    items = stocks.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      emoji: s.emoji,
      gradient: s.gradient,
      seriesName: s.series.name,
      categoryName: s.series.category.name,
    }));
  } catch {
    // No database yet (e.g. running only the anime site) — render an empty nav.
  }
  return (
    <TopBar
      user={
        user
          ? {
              username: user.username,
              cashBalance: user.cashBalance,
              isAdmin: user.isAdmin,
            }
          : null
      }
      items={items}
    />
  );
}
