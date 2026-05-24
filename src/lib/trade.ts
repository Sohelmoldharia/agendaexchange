import { prisma } from "./prisma";
import { quoteBuy, quoteSell, round2 } from "./pricing";

export class TradeError extends Error {}

export type TradeResult = {
  side: "BUY" | "SELL";
  ticker: string;
  shares: number;
  avgPrice: number;
  total: number;
  newPrice: number;
  cashBalance: number;
  sharesOwned: number;
};

const MAX_SHARES = 10_000_000;

export async function executeTrade(
  userId: string,
  ticker: string,
  side: "BUY" | "SELL",
  shares: number,
): Promise<TradeResult> {
  if (!Number.isFinite(shares) || shares <= 0 || Math.floor(shares) !== shares) {
    throw new TradeError("Enter a whole number of shares.");
  }
  if (shares > MAX_SHARES) {
    throw new TradeError("That's more shares than exist. Pick a smaller amount.");
  }

  return prisma.$transaction(async (tx) => {
    const stock = await tx.stock.findUnique({
      where: { ticker: ticker.toUpperCase() },
    });
    if (!stock) throw new TradeError("Stock not found.");

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new TradeError("You must be signed in to trade.");

    const holding = await tx.holding.findUnique({
      where: { userId_stockId: { userId, stockId: stock.id } },
    });

    if (side === "BUY") {
      const q = quoteBuy(stock.price, shares, stock.liquidity);
      if (q.total > user.cashBalance) {
        throw new TradeError(
          `Not enough cash. This costs $${q.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        );
      }

      const prevShares = holding?.shares ?? 0;
      const prevCostBasis = prevShares * (holding?.avgCost ?? 0);
      const newShares = prevShares + shares;
      const newAvg = round2((prevCostBasis + q.total) / newShares);

      await tx.holding.upsert({
        where: { userId_stockId: { userId, stockId: stock.id } },
        create: { userId, stockId: stock.id, shares, avgCost: round2(q.avgPrice) },
        update: { shares: newShares, avgCost: newAvg },
      });
      await tx.user.update({
        where: { id: userId },
        data: { cashBalance: round2(user.cashBalance - q.total) },
      });
      await tx.stock.update({
        where: { id: stock.id },
        data: {
          price: round2(q.newPrice),
          sharesHeld: { increment: shares },
          volume: { increment: q.total },
        },
      });
      await tx.order.create({
        data: {
          userId,
          stockId: stock.id,
          side: "BUY",
          shares,
          price: round2(q.avgPrice),
          total: q.total,
        },
      });
      await tx.pricePoint.create({
        data: { stockId: stock.id, price: round2(q.newPrice) },
      });

      return {
        side,
        ticker: stock.ticker,
        shares,
        avgPrice: round2(q.avgPrice),
        total: q.total,
        newPrice: round2(q.newPrice),
        cashBalance: round2(user.cashBalance - q.total),
        sharesOwned: newShares,
      };
    }

    // SELL
    if (!holding || holding.shares < shares) {
      throw new TradeError(
        `You only own ${holding?.shares ?? 0} ${holding?.shares === 1 ? "share" : "shares"}.`,
      );
    }
    const q = quoteSell(stock.price, shares, stock.liquidity);
    const newShares = holding.shares - shares;

    if (newShares <= 0) {
      await tx.holding.delete({
        where: { userId_stockId: { userId, stockId: stock.id } },
      });
    } else {
      await tx.holding.update({
        where: { userId_stockId: { userId, stockId: stock.id } },
        data: { shares: newShares },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: { cashBalance: round2(user.cashBalance + q.total) },
    });
    await tx.stock.update({
      where: { id: stock.id },
      data: {
        price: round2(q.newPrice),
        sharesHeld: { set: Math.max(0, stock.sharesHeld - shares) },
        volume: { increment: q.total },
      },
    });
    await tx.order.create({
      data: {
        userId,
        stockId: stock.id,
        side: "SELL",
        shares,
        price: round2(q.avgPrice),
        total: q.total,
      },
    });
    await tx.pricePoint.create({
      data: { stockId: stock.id, price: round2(q.newPrice) },
    });

    return {
      side,
      ticker: stock.ticker,
      shares,
      avgPrice: round2(q.avgPrice),
      total: q.total,
      newPrice: round2(q.newPrice),
      cashBalance: round2(user.cashBalance + q.total),
      sharesOwned: newShares,
    };
  });
}
