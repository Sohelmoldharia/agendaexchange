import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(n: number): string {
  const decimals = n < 1 ? 4 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoney(n: number): string {
  return "$" + formatPrice(n);
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000_000)
    return "$" + (n / 1_000_000_000).toFixed(2) + "B";
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}

export function formatSignedMoney(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return sign + "$" + formatPrice(Math.abs(n));
}
