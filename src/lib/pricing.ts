// Bonding-curve pricing. Price moves linearly with the number of shares traded:
// buying `q` shares pushes the price up by a factor of (1 + q/liquidity); selling
// pushes it down. The cash cost/proceeds use the average of the start and end
// price (the area under the curve), so a buy-then-sell round trip costs a spread.
// This module is pure (no server deps) so the client can preview quotes live.

export const MIN_PRICE = 0.01;

export function priceAfterBuy(
  price: number,
  shares: number,
  liquidity: number,
): number {
  return price * (1 + shares / liquidity);
}

export function priceAfterSell(
  price: number,
  shares: number,
  liquidity: number,
): number {
  return Math.max(MIN_PRICE, price * (1 - shares / liquidity));
}

export type Quote = {
  shares: number;
  newPrice: number;
  avgPrice: number;
  /** total cash for the trade (cost for buys, proceeds for sells) */
  total: number;
};

export function quoteBuy(
  price: number,
  shares: number,
  liquidity: number,
): Quote {
  const newPrice = priceAfterBuy(price, shares, liquidity);
  const total = round2((shares * (price + newPrice)) / 2);
  return { shares, newPrice, total, avgPrice: shares > 0 ? total / shares : price };
}

export function quoteSell(
  price: number,
  shares: number,
  liquidity: number,
): Quote {
  const newPrice = priceAfterSell(price, shares, liquidity);
  const total = round2((shares * (price + newPrice)) / 2);
  return { shares, newPrice, total, avgPrice: shares > 0 ? total / shares : price };
}

// Largest whole share count buyable with `budget`, given the bonding curve.
// cost(q) = price*q + price*q^2/(2*liquidity). Solve cost(q) <= budget.
export function maxSharesForBudget(
  price: number,
  budget: number,
  liquidity: number,
): number {
  if (budget <= 0 || price <= 0) return 0;
  const a = price / (2 * liquidity);
  const b = price;
  const c = -budget;
  const q = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  return Math.max(0, Math.floor(q));
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
