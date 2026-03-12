/**
 * BrandsView — Product Intelligence (Dark Theme)
 *
 * 300+ brands, revenue by brand, margin, customer overlap, velocity tiers.
 * Real data from Monday.com deals.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";
import { ALL_DEALS } from "../data/monday";
import { Search, Package, TrendingUp, ShoppingBag, BarChart3, Star, ArrowUpRight } from "lucide-react";

// ── Brand Intelligence ───────────────────────────────────────────────

interface BrandProfile {
  name: string;
  dealCount: number;
  revenue: number;
  cost: number;
  margin: number;
  customers: string[];
  vendors: string[];
  avgDealSize: number;
  velocityTier: "A" | "B" | "C" | "D";
  wonRate: number;
}

function buildBrandProfiles(): BrandProfile[] {
  const brandMap: Record<string, { deals: typeof ALL_DEALS; won: number; total: number }> = {};

  ALL_DEALS.forEach(deal => {
    if (!deal.brand) return;
    if (!brandMap[deal.brand]) brandMap[deal.brand] = { deals: [], won: 0, total: 0 };
    brandMap[deal.brand].deals.push(deal);
    brandMap[deal.brand].total++;
    if (deal.stage === "Won") brandMap[deal.brand].won++;
  });

  return Object.entries(brandMap).map(([name, data]) => {
    const revenue = data.deals.reduce((s, d) => s + d.sellTotal, 0);
    const cost = data.deals.reduce((s, d) => s + d.buyTotal, 0);
    const margin = revenue > 0 ? ((revenue - cost) / revenue * 100) : 0;
    const customers = [...new Set(data.deals.map(d => d.customer).filter(Boolean))];
    const vendors = [...new Set(data.deals.map(d => d.vendor).filter(Boolean))];
    const avgDealSize = data.deals.length > 0 ? revenue / data.deals.length : 0;
    const wonRate = data.total > 0 ? (data.won / data.total * 100) : 0;

    let velocityTier: "A" | "B" | "C" | "D" = "D";
    if (data.deals.length >= 10 && revenue >= 500000) velocityTier = "A";
    else if (data.deals.length >= 5 && revenue >= 200000) velocityTier = "B";
    else if (data.deals.length >= 2 && revenue >= 50000) velocityTier = "C";

    return { name, dealCount: data.deals.length, revenue, cost, margin, customers, vendors, avgDealSize, velocityTier, wonRate };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ── Velocity Tier Config (Dark) ──────────────────────────────────────

const VELOCITY_CONFIG = {
  A: { label: "A", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", description: "High-velocity" },
  B: { label: "B", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", description: "Growing" },
  C: { label: "C", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", description: "Moderate" },
  D: { label: "D", color: "text-zinc-500", bg: "bg-zinc-800/60", border: "border-zinc-700/30", description: "Low" },
};

// ── Component ────────────────────────────────────────────────────────

export default function BrandsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<"all" | "A" | "B" | "C" | "D">("all");

  const brands = useMemo(() => buildBrandProfiles(), []);

  const filtered = useMemo(() => {
    return brands
      .filter(b => filterTier === "all" || b.velocityTier === filterTier)
      .filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [brands, filterTier, searchQuery]);

  const selected = brands.find(b => b.name === selectedBrand);

  const totalBrands = brands.length;
  const totalRevenue = brands.reduce((s, b) => s + b.revenue, 0);
  const tierCounts = {
    A: brands.filter(b => b.velocityTier === "A").length,
    B: brands.filter(b => b.velocityTier === "B").length,
    C: brands.filter(b => b.velocityTier === "C").length,
    D: brands.filter(b => b.velocityTier === "D").length,
  };

  return (
    <div className="h-full flex">
      {/* Brand List */}
      <div className="w-[400px] flex-none flex flex-col border-r border-zinc-800/60">
        {/* Header */}
        <div className="flex-none px-4 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-violet-400" />
            <h1 className="text-sm font-semibold text-white">Brands</h1>
            <span className="text-[10px] text-zinc-500">{totalBrands} brands</span>
          </div>

          <p className="text-[11px] text-zinc-500 italic mb-2">
            {tierCounts.A} high-velocity brands drive {totalRevenue > 0 ? ((brands.filter(b => b.velocityTier === "A").reduce((s, b) => s + b.revenue, 0) / totalRevenue) * 100).toFixed(0) : 0}% of revenue.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search brands..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30"
            />
          </div>
        </div>

        {/* Tier filters */}
        <div className="flex-none px-4 py-2 border-b border-zinc-800/60 flex items-center gap-1">
          <button
            onClick={() => setFilterTier("all")}
            className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              filterTier === "all" ? "bg-violet-500/10 text-violet-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >All ({totalBrands})</button>
          {(["A", "B", "C", "D"] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                filterTier === tier
                  ? cn(VELOCITY_CONFIG[tier].bg, VELOCITY_CONFIG[tier].color)
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tier} ({tierCounts[tier]})
            </button>
          ))}
        </div>

        {/* Brand list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((brand, i) => (
            <motion.button
              key={brand.name}
              initial={i < 30 ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              onClick={() => setSelectedBrand(brand.name)}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-zinc-800/20 transition-all",
                selectedBrand === brand.name ? "bg-violet-500/5" : "hover:bg-zinc-800/30",
              )}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "text-[8px] font-bold w-4 h-4 rounded flex items-center justify-center flex-none",
                    VELOCITY_CONFIG[brand.velocityTier].bg,
                    VELOCITY_CONFIG[brand.velocityTier].color,
                  )}>
                    {brand.velocityTier}
                  </span>
                  <span className="text-xs font-medium text-zinc-200 truncate">{brand.name}</span>
                </div>
                <span className="text-xs font-mono text-zinc-300 tabular-nums flex-none">{formatCurrency(brand.revenue)}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 ml-6">
                <span>{brand.dealCount} deals</span>
                <span>{brand.customers.length} customers</span>
                <span className={cn(
                  brand.margin >= 15 ? "text-emerald-400" : brand.margin >= 10 ? "text-amber-400" : "text-red-400"
                )}>
                  {brand.margin.toFixed(1)}%
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Brand Detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-5"
            >
              {/* Brand header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    VELOCITY_CONFIG[selected.velocityTier].bg,
                    VELOCITY_CONFIG[selected.velocityTier].color,
                    VELOCITY_CONFIG[selected.velocityTier].border,
                  )}>
                    Tier {selected.velocityTier} — {VELOCITY_CONFIG[selected.velocityTier].description}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {selected.dealCount} deals · {selected.customers.length} customers · {selected.vendors.length} vendors
                </p>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Revenue", value: formatCurrency(selected.revenue), icon: TrendingUp, color: "text-emerald-400" },
                  { label: "Avg Deal", value: formatCurrency(selected.avgDealSize), icon: ShoppingBag, color: "text-blue-400" },
                  { label: "Margin", value: `${selected.margin.toFixed(1)}%`, icon: BarChart3, color: selected.margin >= 15 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Win Rate", value: `${selected.wonRate.toFixed(0)}%`, icon: Star, color: selected.wonRate >= 50 ? "text-emerald-400" : "text-amber-400" },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-xl p-3 border border-zinc-800/40 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{kpi.label}</span>
                      <kpi.icon className={cn("w-3 h-3", kpi.color)} />
                    </div>
                    <p className={cn("text-sm font-mono font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Customers */}
              <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Customers ({selected.customers.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.customers.map(c => (
                    <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/30 text-zinc-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vendors */}
              <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Vendors / Sources ({selected.vendors.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.vendors.map(v => (
                    <span key={v} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI insights */}
              <div className="p-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 border-l-2 border-l-violet-500/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <ArrowUpRight className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider">Intelligence</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {selected.customers.length >= 3
                    ? `${selected.name} is popular across ${selected.customers.length} customers. Consider negotiating volume pricing with vendors for better margins.`
                    : selected.margin < 10
                    ? `${selected.name} margin at ${selected.margin.toFixed(1)}% is below target. Review vendor pricing or adjust customer quotes.`
                    : `${selected.name} performing well. ${selected.wonRate.toFixed(0)}% win rate with ${selected.margin.toFixed(1)}% margin.`
                  }
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <Package className="w-10 h-10 mb-3 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">Select a brand</p>
            <p className="text-xs text-zinc-600 mt-1">View revenue, margin, and customer data</p>
          </div>
        )}
      </div>
    </div>
  );
}
