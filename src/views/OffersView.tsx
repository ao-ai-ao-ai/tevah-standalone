import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Send, Handshake, Clock, CheckCircle2, FileText } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { DEALS_BY_NUMBER } from "../data/deal-intelligence";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";
import { CascadeCompact, type CascadeData } from "../components/cascade";

const OFFER_STAGES = ["Not sent yet", "waiting for specs", "Need Confirmation", "Negotiation", "Confirmed"];

type Tab = "all" | "pending" | "negotiation" | "confirmed";

const TABS: { key: Tab; label: string; stages: string[] }[] = [
  { key: "all", label: "All", stages: OFFER_STAGES },
  { key: "pending", label: "Pending", stages: ["Not sent yet", "waiting for specs", "Need Confirmation"] },
  { key: "negotiation", label: "Negotiation", stages: ["Negotiation"] },
  { key: "confirmed", label: "Confirmed", stages: ["Confirmed"] },
];

export function OffersView() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const allOffers = useMemo(() => ALL_DEALS.filter(d => OFFER_STAGES.includes(d.stage)), []);

  const filtered = useMemo(() => {
    const activeTab = TABS.find(t => t.key === tab)!;
    return allOffers
      .filter(d => activeTab.stages.includes(d.stage))
      .filter(d => !search ||
        d.dealNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.brand.toLowerCase().includes(search.toLowerCase()) ||
        d.vendor.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [allOffers, tab, search]);

  const stats = useMemo(() => {
    const totalValue = allOffers.reduce((s, d) => s + d.sellTotal, 0);
    const withMargin = allOffers.filter(d => d.margin > 0);
    const avgMargin = withMargin.length > 0
      ? withMargin.reduce((s, d) => s + d.margin, 0) / withMargin.length
      : 0;
    const pending = allOffers.filter(d => ["Not sent yet", "waiting for specs", "Need Confirmation"].includes(d.stage)).length;
    const negotiating = allOffers.filter(d => d.stage === "Negotiation").length;
    const confirmed = allOffers.filter(d => d.stage === "Confirmed").length;
    return { total: allOffers.length, totalValue, avgMargin, pending, negotiating, confirmed };
  }, [allOffers]);

  function cascadeFor(d: typeof allOffers[0]): CascadeData {
    return { vendorCost: d.buyTotal, ourPrice: d.sellTotal > 0 ? d.buyTotal + d.spread * 0.5 : d.buyTotal, customerAsk: d.sellTotal };
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Offers</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {stats.total} active proposals — {formatCurrency(stats.totalValue)} pipeline value
              {filtered.length !== allOffers.length && <span className="text-purple-600 ml-1">({filtered.length} shown)</span>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offers..."
              className="h-8 pl-8 pr-3 w-56 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200" />
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total Offers", value: stats.total.toString(), icon: FileText, color: "text-blue-600", iconBg: "bg-blue-50" },
            { label: "Pipeline Value", value: formatCurrency(stats.totalValue), icon: Send, color: "text-purple-600", iconBg: "bg-purple-50" },
            { label: "Avg Margin", value: stats.avgMargin > 0 ? `${stats.avgMargin.toFixed(1)}%` : "--", icon: Handshake, color: "text-emerald-600", iconBg: "bg-emerald-50" },
            { label: "Awaiting Response", value: stats.pending.toString(), icon: Clock, color: "text-amber-600", iconBg: "bg-amber-50" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card variant="kpi" className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", m.iconBg)}>
                    <m.icon className={cn("w-3 h-3", m.color)} />
                  </div>
                  <span className="text-[9px] text-text-tertiary uppercase tracking-wider">{m.label}</span>
                </div>
                <p className={cn("text-lg font-bold tabular-nums", m.color)}>{m.value}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => {
            const count = t.key === "all" ? stats.total : t.key === "pending" ? stats.pending : t.key === "negotiation" ? stats.negotiating : stats.confirmed;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  tab === t.key
                    ? "bg-purple-100 text-purple-700"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-white"
                )}>
                {t.label}
                <span className={cn("ml-1.5 text-[10px] tabular-nums", tab === t.key ? "text-purple-500" : "text-text-disabled")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <Card variant="standard" className="mx-4 mt-4 mb-4 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-divider">
                {["Deal #", "Brand", "Customer", "Vendor", "Stage", "Items", "Price Chain", "Sell", "Spread", "Margin", "Date"].map(h => (
                  <th key={h} className="text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-text-tertiary text-sm">No offers match your filters.</td></tr>
              )}
              {filtered.map((deal, i) => (
                <motion.tr
                  key={deal.id}
                  initial={i < 40 ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.012, 0.5) }}
                  onMouseEnter={() => setHoveredId(deal.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "border-b border-divider cursor-pointer transition-colors",
                    hoveredId === deal.id ? "bg-purple-50/40" : "hover:bg-hover"
                  )}
                >
                  <td className="px-3 py-2.5 font-mono text-text-secondary">#{deal.dealNumber}</td>
                  <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-[140px]">{deal.brand || "--"}</td>
                  <td className="px-3 py-2.5 text-text-primary truncate max-w-[160px]">{deal.customer || "--"}</td>
                  <td className="px-3 py-2.5 text-text-tertiary truncate max-w-[140px]">{deal.vendor || "--"}</td>
                  <td className="px-3 py-2.5"><StagePill stage={deal.stage} size="xs" /></td>
                  <td className="px-3 py-2.5">
                    {(() => {
                      const intel = DEALS_BY_NUMBER[deal.dealNumber];
                      const count = intel?.items?.length || 0;
                      return count > 0
                        ? <span className="text-[10px] font-mono text-purple-600 font-medium">{count} SKUs</span>
                        : <span className="text-text-disabled text-[10px]">--</span>;
                    })()}
                  </td>
                  <td className="px-3 py-2.5">
                    {(deal.buyTotal > 0 || deal.sellTotal > 0)
                      ? <CascadeCompact data={cascadeFor(deal)} />
                      : <span className="text-text-disabled text-[10px]">no pricing</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 font-mono text-text-primary tabular-nums">{deal.sellTotal > 0 ? formatCurrency(deal.sellTotal) : "--"}</td>
                  <td className="px-3 py-2.5">
                    {deal.spread !== 0
                      ? <span className={cn("font-mono tabular-nums", deal.spread >= 0 ? "text-emerald-600" : "text-red-500")}>{formatCurrency(deal.spread)}</span>
                      : <span className="text-text-tertiary">--</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {deal.margin > 0
                      ? <span className={cn("font-mono tabular-nums", deal.margin >= 15 ? "text-emerald-600" : deal.margin >= 10 ? "text-amber-600" : "text-red-500")}>{deal.margin}%</span>
                      : <span className="text-text-tertiary">--</span>}
                  </td>
                  <td className="px-3 py-2.5 text-text-tertiary whitespace-nowrap">{deal.date || "--"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export default OffersView;
