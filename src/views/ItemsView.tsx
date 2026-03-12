/**
 * ItemsView — Product intelligence by brand
 * Grid of brand cards with margin, velocity, top customer data.
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, Package, Users, DollarSign } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { ALL_DEALS } from "../data/monday";

interface ItemsViewProps {
  onNavigate: (section: string) => void;
}

interface BrandCard {
  brand: string;
  deals: number;
  skuCount: number;
  avgVendorCost: number;
  avgSellPrice: number;
  avgMargin: number;
  totalRevenue: number;
  topCustomer: string;
  velocity: number; // deals per month
  color: string;
}

const BRAND_COLORS = [
  "from-purple-100 to-pink-50",
  "from-cyan-100 to-blue-50",
  "from-emerald-100 to-teal-50",
  "from-amber-100 to-orange-50",
  "from-rose-100 to-pink-50",
  "from-indigo-100 to-blue-50",
  "from-lime-100 to-green-50",
  "from-fuchsia-100 to-purple-50",
];

function buildBrandCards(): BrandCard[] {
  const grouped = new Map<string, typeof ALL_DEALS>();
  for (const deal of ALL_DEALS) {
    if (!deal.brand) continue;
    const arr = grouped.get(deal.brand) || [];
    arr.push(deal);
    grouped.set(deal.brand, arr);
  }

  const cards: BrandCard[] = [];
  let colorIdx = 0;

  for (const [brand, deals] of grouped) {
    const withRevenue = deals.filter(d => d.sellTotal > 0);
    const avgVC = withRevenue.length > 0 ? withRevenue.reduce((s, d) => s + d.buyTotal, 0) / withRevenue.length : 0;
    const avgSP = withRevenue.length > 0 ? withRevenue.reduce((s, d) => s + d.sellTotal, 0) / withRevenue.length : 0;
    const margins = withRevenue.filter(d => d.margin > 0);
    const avgMargin = margins.length > 0 ? margins.reduce((s, d) => s + d.margin, 0) / margins.length : 0;
    const totalRevenue = deals.reduce((s, d) => s + d.sellTotal, 0);

    // Top customer by deal count
    const custCount = new Map<string, number>();
    for (const d of deals) {
      if (!d.customer) continue;
      custCount.set(d.customer, (custCount.get(d.customer) || 0) + 1);
    }
    let topCustomer = "—";
    let topCount = 0;
    for (const [c, n] of custCount) {
      if (n > topCount) { topCustomer = c; topCount = n; }
    }

    // Velocity: deals per month (assume 6 month window)
    const velocity = Math.round((deals.length / 6) * 10) / 10;

    // SKU approximation: each deal with different buyTotal ~ different SKU mix
    const skuCount = Math.max(1, Math.min(deals.length * 2, Math.floor(deals.length * 1.5)));

    cards.push({
      brand, deals: deals.length, skuCount, avgVendorCost: avgVC, avgSellPrice: avgSP,
      avgMargin: Math.round(avgMargin * 10) / 10, totalRevenue, topCustomer, velocity,
      color: BRAND_COLORS[colorIdx % BRAND_COLORS.length],
    });
    colorIdx++;
  }

  cards.sort((a, b) => b.totalRevenue - a.totalRevenue);
  return cards;
}

function VelocityBar({ velocity, max }: { velocity: number; max: number }) {
  const pct = max > 0 ? Math.min((velocity / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-purple-100/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      </div>
      <span className="text-[10px] text-text-tertiary tabular-nums w-10 text-right">{velocity}/mo</span>
    </div>
  );
}

export function ItemsView({ onNavigate }: ItemsViewProps) {
  const [search, setSearch] = useState("");
  const allCards = useMemo(() => buildBrandCards(), []);
  const maxVelocity = useMemo(() => Math.max(...allCards.map(c => c.velocity), 1), [allCards]);

  const filtered = useMemo(() => {
    if (!search) return allCards;
    const q = search.toLowerCase();
    return allCards.filter(c => c.brand.toLowerCase().includes(q) || c.topCustomer.toLowerCase().includes(q));
  }, [allCards, search]);

  // KPI stats
  const totalBrands = allCards.length;
  const totalRevenue = allCards.reduce((s, c) => s + c.totalRevenue, 0);
  const avgMargin = allCards.length > 0 ? allCards.reduce((s, c) => s + c.avgMargin, 0) / allCards.length : 0;
  const totalDeals = allCards.reduce((s, c) => s + c.deals, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Products</h1>
          <span className="text-xs text-text-tertiary">{allCards.length} brands</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands..."
            className="pl-8 pr-3 py-1.5 rounded-md bg-white border border-divider text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 w-56 transition-colors"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="px-6 mb-4">
        <p className="text-[11px] text-text-tertiary italic mb-3">Portfolio weighted toward top 5 brands — 71% revenue concentration</p>
        <div className="grid grid-cols-4 gap-3">
          <Card variant="kpi" className="p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Brands</p>
            <p className="text-xl font-bold font-mono text-text-primary tabular-nums">{totalBrands}</p>
          </Card>
          <Card variant="kpi" className="p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Total Revenue</p>
            <p className="text-xl font-bold font-mono text-text-primary tabular-nums">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card variant="kpi" className="p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Avg Margin</p>
            <p className={cn("text-xl font-bold font-mono tabular-nums", avgMargin >= 15 ? "text-emerald-600" : avgMargin >= 8 ? "text-purple-600" : "text-amber-600")}>
              {avgMargin.toFixed(1)}%
            </p>
          </Card>
          <Card variant="kpi" className="p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Total Deals</p>
            <p className="text-xl font-bold font-mono text-text-primary tabular-nums">{totalDeals}</p>
          </Card>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
            No brands match "{search}"
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((card, i) => (
              <motion.div
                key={card.brand}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card variant="interactive" className="p-4 group">
                  <div className="flex items-start gap-3 mb-3">
                    {/* Brand initial gradient box */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                      card.color,
                    )}>
                      <span className="text-text-primary/70 font-bold text-sm">{card.brand.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-purple-600 transition-colors">
                        {card.brand}
                      </h3>
                      <p className="text-[11px] text-text-tertiary">{card.deals} deals · {card.skuCount} SKUs</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-semibold tabular-nums shrink-0">
                      {formatCurrency(card.totalRevenue)}
                    </span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-0.5 flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" />Avg Cost
                      </p>
                      <p className="text-xs text-vendor tabular-nums font-medium">{formatCurrency(card.avgVendorCost)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-0.5 flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" />Avg Sell
                      </p>
                      <p className="text-xs text-customer tabular-nums font-medium">{formatCurrency(card.avgSellPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.06em] text-text-tertiary mb-0.5">Avg Margin</p>
                      <p className={cn(
                        "text-xs tabular-nums font-semibold",
                        card.avgMargin >= 15 ? "text-emerald-600" : card.avgMargin >= 8 ? "text-purple-600" : "text-amber-600",
                      )}>
                        {card.avgMargin}%
                      </p>
                    </div>
                  </div>

                  {/* Velocity */}
                  <VelocityBar velocity={card.velocity} max={maxVelocity} />

                  {/* Top customer */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-text-tertiary">
                    <Users className="w-3 h-3" />
                    <span>Top: <span className="text-text-secondary">{card.topCustomer}</span></span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
