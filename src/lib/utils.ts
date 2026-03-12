import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(amount >= 100_000 ? 0 : 1)}K`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatCurrencyExact(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

/**
 * Compute spread/margin from sell/buy totals.
 * Monday.com data has many margin=0 and spread != sell-buy.
 * Use this when you need the actual computed values.
 */
export function computeSpread(sellTotal: number, buyTotal: number): number {
  return Math.round((sellTotal - buyTotal) * 100) / 100;
}

export function computeMargin(sellTotal: number, buyTotal: number): number {
  if (sellTotal <= 0) return 0;
  return Math.round(((sellTotal - buyTotal) / sellTotal) * 1000) / 10;
}

export function effectiveSpread(deal: { sellTotal: number; buyTotal: number; spread: number }): number {
  const computed = computeSpread(deal.sellTotal, deal.buyTotal);
  // Use Monday's spread if it's nonzero and deals have values, else compute
  if (deal.spread !== 0 && deal.sellTotal > 0) return deal.spread;
  return computed;
}

export function effectiveMargin(deal: { sellTotal: number; buyTotal: number; margin: number }): number {
  // If Monday provided margin > 0, trust it; otherwise compute
  if (deal.margin > 0) return deal.margin;
  return computeMargin(deal.sellTotal, deal.buyTotal);
}
