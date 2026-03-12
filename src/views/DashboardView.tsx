/**
 * DashboardView — Command center with real QB + Monday data
 *
 * Shows unified KPIs from QuickBooks (real invoices/bills)
 * combined with Monday.com deals (pipeline, stages).
 */

import { useMemo } from "react";
import { motion } from "motion/react";
import { AlertTriangle, DollarSign, TrendingUp, Package, Clock, CreditCard, Zap, ArrowRight, Receipt } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { STAGE_GROUP_COLORS, mondayStageToPipeline, isSlaBreached, type StageGroup } from "../data/emails";
import { getDecisions, getDecisionsBySplit, estimateTime } from "../data/decisions";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill, StageGroupBadge } from "../components/stage-pill";
import { useUnifiedData } from "../lib/use-unified";

export default function DashboardView({ onNavigate }: { onNavigate: (section: string, id?: string) => void }) {
  const { data, loading } = useUnifiedData();

  const stats = useMemo(() => {
    const active = ALL_DEALS.filter(d => !["Won", "Lost"].includes(d.stage));
    const won = ALL_DEALS.filter(d => d.stage === "Won");
    const breached = active.filter(isSlaBreached);
    const overdue = ALL_DEALS.filter(d => d.payment === "Overdue");
    const dealsWithMargin = ALL_DEALS.filter(d => d.sellTotal > 0 && d.margin > 0);
    const avgMargin = dealsWithMargin.reduce((s, d) => s + d.margin, 0) / Math.max(1, dealsWithMargin.length);

    // Pipeline by group
    const groupCounts: Record<string, { count: number; value: number }> = {};
    for (const deal of active) {
      const stage = mondayStageToPipeline(deal.stage);
      const group = stage.group;
      if (!groupCounts[group]) groupCounts[group] = { count: 0, value: 0 };
      groupCounts[group].count++;
      groupCounts[group].value += deal.sellTotal;
    }

    return { active, won, breached, overdue, avgMargin, groupCounts };
  }, []);

  const decisions = useMemo(() => getDecisions(), []);
  const splits = useMemo(() => getDecisionsBySplit(decisions), [decisions]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const { kpis, qbLoaded, customers } = data;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{greeting}, Yaakov</h1>
              <p className="text-xs text-text-tertiary mt-0.5">
                {kpis.dealCount} deals — {formatCurrency(kpis.totalInvoiced)} invoiced — {formatCurrency(kpis.grossSpread)} spread
                {qbLoaded && <span className="ml-1.5 text-emerald-600">(QB live)</span>}
              </p>
            </div>
            {loading && (
              <div className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            )}
          </div>
        </motion.div>

        {/* The Call Summary */}
        {decisions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card variant="interactive" className="p-4 hover:shadow-[var(--shadow-md)] transition-shadow" onClick={() => onNavigate("the-call")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">The Call</h2>
                    <p className="text-xs text-text-secondary">
                      {decisions.length} decisions · {estimateTime(decisions.length)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {splits.pricing.length > 0 && <StageGroupBadge group="DEAL" count={splits.pricing.length} />}
                  {splits.orders.length > 0 && <StageGroupBadge group="MOVE" count={splits.orders.length} />}
                  {splits.money.length > 0 && <StageGroupBadge group="LOCK" count={splits.money.length} />}
                  {splits.problems.length > 0 && <StageGroupBadge group="PROBLEM" count={splits.problems.length} />}
                  <ArrowRight className="w-4 h-4 text-text-tertiary ml-2" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Key Metrics — now with real QB data */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Invoiced", value: formatCurrency(kpis.totalInvoiced), icon: Receipt, color: "text-blue-600", iconBg: "bg-blue-50" },
            { label: "Gross Spread", value: formatCurrency(kpis.grossSpread), icon: TrendingUp, color: "text-emerald-600", iconBg: "bg-emerald-50" },
            { label: "Active Deals", value: stats.active.length.toString(), icon: Package, color: "text-purple-600", iconBg: "bg-purple-50" },
            { label: qbLoaded ? "Avg Health" : "Avg Margin", value: qbLoaded ? `${kpis.avgHealthScore.toFixed(0)}` : `${stats.avgMargin.toFixed(1)}%`, icon: TrendingUp, color: kpis.avgHealthScore >= 70 ? "text-emerald-600" : "text-amber-600", iconBg: kpis.avgHealthScore >= 70 ? "bg-emerald-50" : "bg-amber-50" },
          ].map((metric, i) => (
            <motion.div key={metric.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card variant="kpi" className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", metric.iconBg)}>
                    <metric.icon className={cn("w-3.5 h-3.5", metric.color)} />
                  </div>
                  <span className="text-[10px] text-text-tertiary uppercase tracking-wider">{metric.label}</span>
                </div>
                <p className={cn("text-xl font-bold tabular-nums", metric.color)}>{metric.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Money in Motion — REAL QB data */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Money in Motion</h2>
            {qbLoaded && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">Real QB Data</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4" onClick={() => onNavigate("invoices")}>
              <p className="text-[9px] text-text-tertiary uppercase mb-1">Accounts Receivable</p>
              <p className="text-lg font-bold text-amber-600 tabular-nums">{formatCurrency(kpis.totalAR)}</p>
              <p className="text-[10px] text-text-tertiary mt-1">{kpis.invoiceCount} invoices outstanding</p>
            </Card>
            <Card className="p-4" onClick={() => onNavigate("invoices")}>
              <p className="text-[9px] text-text-tertiary uppercase mb-1">Accounts Payable</p>
              <p className="text-lg font-bold text-purple-600 tabular-nums">{formatCurrency(kpis.totalAP)}</p>
              <p className="text-[10px] text-text-tertiary mt-1">{kpis.billCount} bills outstanding</p>
            </Card>
            <Card className="p-4" onClick={() => onNavigate("finance")}>
              <p className="text-[9px] text-text-tertiary uppercase mb-1">Net Position</p>
              <p className={cn("text-lg font-bold tabular-nums", kpis.netPosition >= 0 ? "text-emerald-600" : "text-red-500")}>
                {formatCurrency(kpis.netPosition)}
              </p>
              <p className="text-[10px] text-text-tertiary mt-1">AR minus AP</p>
            </Card>
          </div>
        </motion.div>

        {/* Urgent Attention */}
        {(stats.breached.length > 0 || stats.overdue.length > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-500" /> Needs Attention
            </h2>
            <div className="space-y-1.5">
              {stats.breached.slice(0, 5).map(deal => (
                <button key={deal.id} onClick={() => onNavigate("the-call")}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 hover:border-red-300 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Clock className="w-3.5 h-3.5 text-red-500 flex-none" />
                    <div>
                      <span className="text-[10px] font-mono text-text-secondary">#{deal.dealNumber}</span>
                      <span className="text-xs text-text-primary ml-2">{deal.customer}</span>
                      <span className="text-[10px] text-text-tertiary ml-2">{deal.brand}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StagePill stage={deal.stage} />
                    {deal.sellTotal > 0 && <span className="text-xs font-mono text-text-primary tabular-nums">{formatCurrency(deal.sellTotal)}</span>}
                  </div>
                </button>
              ))}
              {stats.overdue.slice(0, 3).map(deal => (
                <button key={`pay-${deal.id}`} onClick={() => onNavigate("the-call")}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:border-amber-300 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-3.5 h-3.5 text-amber-500 flex-none" />
                    <div>
                      <span className="text-[10px] font-mono text-text-secondary">#{deal.dealNumber}</span>
                      <span className="text-xs text-text-primary ml-2">{deal.customer}</span>
                      <span className="text-[10px] text-red-500 ml-2">Payment Overdue</span>
                    </div>
                  </div>
                  {deal.sellTotal > 0 && <span className="text-xs font-mono text-text-primary tabular-nums">{formatCurrency(deal.sellTotal)}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pipeline by Group */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Pipeline</h2>
          <div className="flex gap-2">
            {(["DEAL", "LOCK", "MOVE", "CHECK", "CLOSE"] as StageGroup[]).map(group => {
              const d = stats.groupCounts[group] || { count: 0, value: 0 };
              if (d.count === 0) return null;
              const colors = STAGE_GROUP_COLORS[group];
              return (
                <button key={group} onClick={() => onNavigate("pipeline")}
                  className={cn("flex-1 p-3 rounded-lg border transition-colors hover:opacity-80", colors.bg, colors.border)}>
                  <p className={cn("text-[10px] font-bold uppercase", colors.text)}>{group}</p>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{d.count}</p>
                  {d.value > 0 && <p className="text-[10px] text-text-tertiary tabular-nums">{formatCurrency(d.value)}</p>}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Top Customers — unified data */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
            Top Customers {qbLoaded && <span className="text-[9px] text-emerald-600 normal-case ml-1">(QB matched)</span>}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {customers.slice(0, 6).map((cust, i) => {
              const revenue = cust.qb?.totalInvoiced ?? cust.mondaySellTotal;
              const unpaid = cust.qb?.totalUnpaid ?? 0;
              return (
                <Card key={cust.name} variant="interactive" className="p-3" onClick={() => onNavigate("customers")}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-text-primary truncate">{cust.name}</span>
                    <div className="flex items-center gap-1.5">
                      {cust.risk !== "ok" && cust.risk !== "clean" && (
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-medium",
                          cust.risk === "critical" ? "bg-red-50 text-red-600" : cust.risk === "high" ? "bg-amber-50 text-amber-600" : "bg-yellow-50 text-yellow-600"
                        )}>{cust.risk}</span>
                      )}
                      <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full",
                        i === 0 ? "bg-purple-50 text-purple-600" : i < 3 ? "bg-amber-50 text-amber-600" : "bg-canvas text-text-tertiary"
                      )}>{cust.dealCount} deals</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(revenue)}</span>
                    {unpaid > 0 && (
                      <span className="text-[10px] tabular-nums text-amber-600">{formatCurrency(unpaid)} unpaid</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Won Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pb-8">
          <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Closed Won</h2>
          <Card className="p-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-purple-600 tabular-nums">{stats.won.length}</p>
                <p className="text-[10px] text-text-tertiary">deals won</p>
              </div>
              <div className="h-8 w-px bg-divider" />
              <div>
                <p className="text-2xl font-bold text-purple-600 tabular-nums">{formatCurrency(stats.won.reduce((s, d) => s + d.sellTotal, 0))}</p>
                <p className="text-[10px] text-text-tertiary">revenue</p>
              </div>
              <div className="h-8 w-px bg-divider" />
              <div>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(stats.won.reduce((s, d) => s + d.spread, 0))}</p>
                <p className="text-[10px] text-text-tertiary">spread</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
