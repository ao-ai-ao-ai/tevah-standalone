/**
 * AnalyticsView — Business Intelligence (Dark Theme)
 *
 * Deal book analytics: revenue, margins, pipeline, brands, payment health.
 * All charts built with div bars — zero external chart dependencies.
 * Real data from Monday.com (500 deals, $15.8M).
 */

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";
import { ALL_DEALS, ALL_CUSTOMERS } from "../data/monday";
import { STAGE_GROUP_COLORS, mondayStageToPipeline, type StageGroup } from "../data/emails";
import {
  DollarSign, TrendingUp, BarChart3, Package, Percent, AlertTriangle,
  CreditCard, ShoppingBag, CheckCircle2, Clock,
} from "lucide-react";

// ── Data Layer ───────────────────────────────────────────────────────

function useAnalytics() {
  return useMemo(() => {
    const active = ALL_DEALS.filter(d => !["Won", "Lost"].includes(d.stage));
    const won = ALL_DEALS.filter(d => d.stage === "Won");
    const totalRevenue = ALL_DEALS.reduce((s, d) => s + d.sellTotal, 0);
    const totalSpread = ALL_DEALS.reduce((s, d) => s + d.spread, 0);
    const withMargin = ALL_DEALS.filter(d => d.sellTotal > 0 && d.margin > 0);
    const avgMargin = withMargin.length > 0
      ? withMargin.reduce((s, d) => s + d.margin, 0) / withMargin.length : 0;
    const wonRate = ALL_DEALS.length > 0 ? (won.length / ALL_DEALS.length * 100) : 0;
    const overdueAR = ALL_DEALS.filter(d => d.payment === "Overdue");
    const overdueTotal = overdueAR.reduce((s, d) => s + d.sellTotal, 0);

    // Revenue by customer (top 10)
    const custMap: Record<string, { revenue: number; margin: number; count: number }> = {};
    ALL_DEALS.forEach(d => {
      if (!d.customer || d.sellTotal === 0) return;
      if (!custMap[d.customer]) custMap[d.customer] = { revenue: 0, margin: 0, count: 0 };
      custMap[d.customer].revenue += d.sellTotal;
      if (d.margin > 0) { custMap[d.customer].margin += d.margin; custMap[d.customer].count++; }
    });
    const topCustomers = Object.entries(custMap)
      .map(([name, v]) => ({ name, revenue: v.revenue, avgMargin: v.count > 0 ? v.margin / v.count : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    const maxCustRevenue = topCustomers[0]?.revenue || 1;

    // Pipeline distribution by group
    const groupMap: Record<string, { count: number; value: number }> = {};
    active.forEach(d => {
      const stage = mondayStageToPipeline(d.stage);
      const g = stage.group;
      if (!groupMap[g]) groupMap[g] = { count: 0, value: 0 };
      groupMap[g].count++;
      groupMap[g].value += d.sellTotal;
    });
    const pipelineGroups = (["DEAL", "LOCK", "MOVE", "CHECK", "CLOSE"] as StageGroup[])
      .map(g => ({ group: g, ...(groupMap[g] || { count: 0, value: 0 }) }))
      .filter(g => g.count > 0);
    const maxGroupCount = Math.max(...pipelineGroups.map(g => g.count), 1);

    // Margin distribution
    const marginBuckets = [
      { label: "0-5%", min: 0, max: 5, color: "bg-red-500" },
      { label: "5-10%", min: 5, max: 10, color: "bg-amber-500" },
      { label: "10-15%", min: 10, max: 15, color: "bg-yellow-500" },
      { label: "15-20%", min: 15, max: 20, color: "bg-emerald-500" },
      { label: "20%+", min: 20, max: Infinity, color: "bg-emerald-400" },
    ].map(b => {
      const deals = withMargin.filter(d => d.margin >= b.min && d.margin < b.max);
      return { ...b, count: deals.length, value: deals.reduce((s, d) => s + d.sellTotal, 0) };
    });
    const maxBucketCount = Math.max(...marginBuckets.map(b => b.count), 1);

    // Top brands
    const brandMap: Record<string, { revenue: number; margin: number; mCount: number; deals: number }> = {};
    ALL_DEALS.forEach(d => {
      if (!d.brand) return;
      if (!brandMap[d.brand]) brandMap[d.brand] = { revenue: 0, margin: 0, mCount: 0, deals: 0 };
      brandMap[d.brand].revenue += d.sellTotal;
      brandMap[d.brand].deals++;
      if (d.margin > 0) { brandMap[d.brand].margin += d.margin; brandMap[d.brand].mCount++; }
    });
    const topBrands = Object.entries(brandMap)
      .map(([name, v]) => ({ name, revenue: v.revenue, deals: v.deals, avgMargin: v.mCount > 0 ? v.margin / v.mCount : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Payment health
    const paymentCounts = {
      received: ALL_DEALS.filter(d => d.payment === "Received").length,
      partial: ALL_DEALS.filter(d => d.payment === "Partially Received").length,
      overdue: overdueAR.length,
      toInvoice: ALL_DEALS.filter(d => d.payment === "To be invoiced").length,
      invoiced: ALL_DEALS.filter(d => d.payment === "Invoiced").length,
    };
    const paymentTotal = paymentCounts.received + paymentCounts.partial + paymentCounts.overdue + paymentCounts.toInvoice + paymentCounts.invoiced;

    return {
      totalRevenue, totalSpread, avgMargin, active: active.length, wonRate, overdueTotal, overdueCount: overdueAR.length,
      topCustomers, maxCustRevenue, pipelineGroups, maxGroupCount,
      marginBuckets, maxBucketCount, topBrands, paymentCounts, paymentTotal,
    };
  }, []);
}

const PIPELINE_BAR_COLORS: Record<StageGroup, string> = {
  DEAL: "bg-blue-400", LOCK: "bg-amber-400", MOVE: "bg-violet-400",
  CHECK: "bg-emerald-400", CLOSE: "bg-green-400", LOST: "bg-gray-500", PROBLEM: "bg-red-400",
};

function marginColorDark(pct: number): string {
  if (pct >= 15) return "text-emerald-400";
  if (pct >= 8) return "text-amber-400";
  return "text-red-400";
}

// ── Component ────────────────────────────────────────────────────────

export default function AnalyticsView() {
  const d = useAnalytics();

  const kpis = [
    { label: "Total Revenue", value: formatCurrency(d.totalRevenue), icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5" },
    { label: "Total Spread", value: formatCurrency(d.totalSpread), icon: TrendingUp, color: "text-violet-400", bg: "from-violet-500/10 to-purple-500/5" },
    { label: "Avg Margin", value: `${d.avgMargin.toFixed(1)}%`, icon: Percent, color: d.avgMargin >= 12 ? "text-emerald-400" : "text-amber-400", bg: d.avgMargin >= 12 ? "from-emerald-500/10 to-emerald-500/5" : "from-amber-500/10 to-amber-500/5" },
    { label: "Active Deals", value: d.active.toString(), icon: Package, color: "text-blue-400", bg: "from-blue-500/10 to-blue-500/5" },
    { label: "Won Rate", value: `${d.wonRate.toFixed(0)}%`, icon: CheckCircle2, color: "text-green-400", bg: "from-green-500/10 to-green-500/5" },
    { label: "Overdue AR", value: formatCurrency(d.overdueTotal), icon: AlertTriangle, color: "text-red-400", bg: "from-red-500/10 to-red-500/5", sub: `${d.overdueCount} deals` },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {ALL_DEALS.length} deals &middot; {ALL_CUSTOMERS.length} customers &middot; {formatCurrency(d.totalRevenue)} book value
          </p>
        </motion.div>

        {/* KPI Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.03 }}>
              <div className={cn("p-3.5 rounded-xl border border-zinc-800/40 bg-gradient-to-br", kpi.bg)}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">{kpi.label}</span>
                  <kpi.icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
                <p className={cn("text-lg font-mono font-bold tabular-nums leading-none", kpi.color)}>{kpi.value}</p>
                {kpi.sub && <p className="text-[9px] text-zinc-600 mt-1">{kpi.sub}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Customer */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Revenue by Customer</h3>
            <p className="text-[10px] text-zinc-600 mb-3">Top 10 by sell total</p>
            <div className="space-y-2">
              {d.topCustomers.map((c, i) => {
                const pct = (c.revenue / d.maxCustRevenue) * 100;
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-300 truncate max-w-[55%]">
                        <span className="text-zinc-600 text-[10px] mr-1.5">{i + 1}</span>{c.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-mono", marginColorDark(c.avgMargin))}>
                          {c.avgMargin > 0 ? `${c.avgMargin.toFixed(1)}%` : "\u2014"}
                        </span>
                        <span className="text-xs font-mono font-semibold text-zinc-200 tabular-nums">{formatCurrency(c.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", c.avgMargin >= 15 ? "bg-emerald-500/70" : c.avgMargin >= 8 ? "bg-amber-500/70" : "bg-violet-500/70")}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.25 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Pipeline Distribution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Pipeline Distribution</h3>
            <p className="text-[10px] text-zinc-600 mb-3">Active deals by stage group</p>
            <div className="space-y-3">
              {d.pipelineGroups.map((g) => {
                const colors = STAGE_GROUP_COLORS[g.group];
                const pct = (g.count / d.maxGroupCount) * 100;
                return (
                  <div key={g.group}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", colors.bg, colors.text)}>{g.group}</span>
                        <span className="text-xs text-zinc-400">{g.count} deals</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-zinc-200 tabular-nums">{formatCurrency(g.value)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-zinc-800/60 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", PIPELINE_BAR_COLORS[g.group])}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-800/40">
              {(["DEAL", "LOCK", "MOVE", "CHECK", "CLOSE"] as StageGroup[]).map(g => {
                const c = STAGE_GROUP_COLORS[g];
                return <span key={g} className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", c.bg, c.text)}>{g}</span>;
              })}
            </div>
          </motion.div>

          {/* Margin Distribution */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Margin Distribution</h3>
            <p className="text-[10px] text-zinc-600 mb-3">{d.marginBuckets.reduce((s, b) => s + b.count, 0)} deals with reported margins</p>
            <div className="space-y-2.5">
              {d.marginBuckets.map((b) => {
                const pct = (b.count / d.maxBucketCount) * 100;
                return (
                  <div key={b.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-300 font-medium w-12">{b.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500">{b.count} deals</span>
                        <span className="text-xs font-mono font-semibold text-zinc-200 tabular-nums w-16 text-right">{formatCurrency(b.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full opacity-80", b.color)}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Payment Health */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Payment Health</h3>
            <p className="text-[10px] text-zinc-600 mb-3">{d.paymentTotal} deals tracked</p>

            {/* Stacked bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-4 bg-zinc-800/60">
              {[
                { count: d.paymentCounts.received, color: "bg-emerald-500", label: "Received" },
                { count: d.paymentCounts.partial, color: "bg-blue-500", label: "Partial" },
                { count: d.paymentCounts.invoiced, color: "bg-violet-500", label: "Invoiced" },
                { count: d.paymentCounts.toInvoice, color: "bg-zinc-600", label: "To Invoice" },
                { count: d.paymentCounts.overdue, color: "bg-red-500", label: "Overdue" },
              ].map(s => {
                const pct = d.paymentTotal > 0 ? (s.count / d.paymentTotal * 100) : 0;
                return pct > 0 ? (
                  <div key={s.label} className={cn("h-full transition-all", s.color)} style={{ width: `${pct}%` }} title={`${s.label}: ${s.count}`} />
                ) : null;
              })}
            </div>

            {/* Detail rows */}
            <div className="space-y-2">
              {[
                { label: "Received", count: d.paymentCounts.received, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Partially Received", count: d.paymentCounts.partial, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
                { label: "Invoiced", count: d.paymentCounts.invoiced, icon: CreditCard, color: "text-violet-400", bg: "bg-violet-500/10" },
                { label: "To be Invoiced", count: d.paymentCounts.toInvoice, icon: ShoppingBag, color: "text-zinc-400", bg: "bg-zinc-800/60" },
                { label: "Overdue", count: d.paymentCounts.overdue, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", row.bg)}>
                      <row.icon className={cn("w-3 h-3", row.color)} />
                    </div>
                    <span className="text-xs text-zinc-300">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-mono font-bold tabular-nums", row.color)}>{row.count}</span>
                    <span className="text-[10px] text-zinc-600">
                      ({d.paymentTotal > 0 ? (row.count / d.paymentTotal * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Brands — Full width */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-5 rounded-xl border border-zinc-800/40 bg-zinc-900/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">Top Brands</h3>
          <p className="text-[10px] text-zinc-600 mb-3">By total deal value — top 10</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {d.topBrands.map((b, i) => (
              <div key={b.name} className="flex items-center justify-between py-2 border-b border-zinc-800/30 last:border-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0">{i + 1}</span>
                  <BarChart3 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-xs text-zinc-300 truncate">{b.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-[10px] text-zinc-500">{b.deals} deals</span>
                  <span className={cn("text-[10px] font-mono", marginColorDark(b.avgMargin))}>
                    {b.avgMargin > 0 ? `${b.avgMargin.toFixed(1)}%` : "\u2014"}
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-200 tabular-nums">{formatCurrency(b.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
