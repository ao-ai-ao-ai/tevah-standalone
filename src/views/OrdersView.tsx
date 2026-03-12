import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { mondayStageToPipeline, isSlaBreached, getDaysInStage } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";
import { StagePill } from "../components/stage-pill";
import { Card } from "../components/card";

type SortField = "dealNumber" | "customer" | "totalAmount" | "margin" | "stage" | "date";

export default function OrdersView({ onNavigateToOrder }: { onNavigateToOrder?: (id: string) => void; selectedOrderId?: string | null }) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let deals = ALL_DEALS
      .filter(d => !search ||
        d.dealNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.brand.toLowerCase().includes(search.toLowerCase()) ||
        d.vendor.toLowerCase().includes(search.toLowerCase())
      );
    if (stageFilter) deals = deals.filter(d => d.stage === stageFilter);
    if (paymentFilter) deals = deals.filter(d => d.payment === paymentFilter);
    return deals.sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      switch (sortField) {
        case "totalAmount": return (a.sellTotal - b.sellTotal) * mul;
        case "margin": return (a.margin - b.margin) * mul;
        case "dealNumber": return a.dealNumber.localeCompare(b.dealNumber) * mul;
        case "customer": return a.customer.localeCompare(b.customer) * mul;
        case "date": return ((a.date || "").localeCompare(b.date || "")) * mul;
        default: return 0;
      }
    });
  }, [search, sortField, sortAsc, stageFilter, paymentFilter]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const selected = ALL_DEALS.find(d => d.id === selectedId);

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
  );

  const stages = [...new Set(ALL_DEALS.map(d => d.stage))].sort();
  const payments = [...new Set(ALL_DEALS.map(d => d.payment).filter(Boolean))].sort();

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-none px-6 py-4 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Orders</h1>
              <p className="text-xs text-text-tertiary mt-0.5">
                {ALL_DEALS.length} deals — {formatCurrency(ALL_DEALS.reduce((s, d) => s + d.sellTotal, 0))} total value
                {filtered.length !== ALL_DEALS.length && <span className="text-purple-600 ml-1">({filtered.length} shown)</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={stageFilter || ""}
                onChange={e => setStageFilter(e.target.value || null)}
                className="h-8 px-2 text-[10px] bg-white border border-divider rounded-md text-text-secondary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
              >
                <option value="">All stages</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={paymentFilter || ""}
                onChange={e => setPaymentFilter(e.target.value || null)}
                className="h-8 px-2 text-[10px] bg-white border border-divider rounded-md text-text-secondary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
              >
                <option value="">All payments</option>
                {payments.map(s => <option key={s} value={s!}>{s}</option>)}
              </select>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
                  className="h-8 pl-8 pr-3 w-56 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Card variant="standard" className="mx-4 mt-4 mb-4 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-divider">
                  {[
                    { field: "dealNumber" as SortField, label: "Deal #", w: "w-24" },
                    { field: "customer" as SortField, label: "Customer / Brand", w: "" },
                    { field: "stage" as SortField, label: "Stage", w: "w-36" },
                    { field: "totalAmount" as SortField, label: "Sell Total", w: "w-28" },
                    { field: "margin" as SortField, label: "Margin", w: "w-20" },
                    { field: "date" as SortField, label: "Date", w: "w-24" },
                  ].map(col => (
                    <th key={col.field} className={cn("text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-4 py-2.5 cursor-pointer hover:text-text-secondary transition-colors", col.w)} onClick={() => toggleSort(col.field)}>
                      <div className="flex items-center gap-1">
                        {col.label} <SortIcon field={col.field} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal, i) => {
                  const breached = isSlaBreached(deal);
                  return (
                    <motion.tr
                      key={deal.id}
                      initial={i < 50 ? { opacity: 0 } : false}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.01, 0.5) }}
                      onClick={() => {
                        if (onNavigateToOrder) onNavigateToOrder(deal.id);
                        else setSelectedId(selectedId === deal.id ? null : deal.id);
                      }}
                      className={cn(
                        "border-b border-divider cursor-pointer transition-colors",
                        selectedId === deal.id ? "bg-selected" : "hover:bg-hover"
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-text-secondary">#{deal.dealNumber}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-text-primary">{deal.customer || "—"}</span>
                        <span className="text-text-tertiary ml-2">{deal.brand}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <StagePill stage={deal.stage} size="xs" />
                          {breached && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-text-primary tabular-nums">{deal.sellTotal > 0 ? formatCurrency(deal.sellTotal) : "—"}</td>
                      <td className="px-4 py-2.5">
                        {deal.margin > 0 ? (
                          <span className={cn("font-mono tabular-nums", deal.margin >= 15 ? "text-emerald-600" : deal.margin >= 10 ? "text-amber-600" : "text-red-500")}>
                            {deal.margin}%
                          </span>
                        ) : <span className="text-text-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-text-tertiary">{deal.date || "—"}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      {/* Detail panel */}
      {selected && !onNavigateToOrder && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          className="flex-none w-[340px] border-l border-divider overflow-y-auto p-4 space-y-4 bg-canvas"
        >
          <div>
            <p className="text-[11px] text-text-tertiary italic mb-2">Spread tracking across {selected.brand} portfolio</p>
            <p className="text-xs font-mono text-text-tertiary">#{selected.dealNumber}</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{selected.customer || "No customer"}</p>
            <p className="text-xs text-text-secondary">{selected.brand} via {selected.vendor || "Direct"}</p>
          </div>

          <StagePill stage={selected.stage} />

          <div className="grid grid-cols-2 gap-2">
            <Card variant="kpi" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Sell Total</span>
              <p className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(selected.sellTotal)}</p>
            </Card>
            <Card variant="kpi" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Buy Total</span>
              <p className="text-sm font-bold text-text-secondary tabular-nums">{formatCurrency(selected.buyTotal)}</p>
            </Card>
            <Card variant="kpi" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Spread</span>
              <p className={cn("text-sm font-bold tabular-nums", selected.spread >= 0 ? "text-emerald-600" : "text-red-500")}>{formatCurrency(selected.spread)}</p>
            </Card>
            <Card variant="kpi" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Margin</span>
              <p className={cn("text-sm font-bold tabular-nums", selected.margin >= 15 ? "text-emerald-600" : selected.margin >= 10 ? "text-amber-600" : "text-red-500")}>{selected.margin > 0 ? `${selected.margin}%` : "—"}</p>
            </Card>
          </div>

          {selected.payment && (
            <Card variant="standard" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Payment Status</span>
              <p className={cn("text-sm font-bold",
                selected.payment === "Received" ? "text-emerald-600" :
                selected.payment === "Overdue" ? "text-red-500" :
                selected.payment === "Partially Received" ? "text-amber-600" :
                "text-text-secondary"
              )}>{selected.payment}</p>
            </Card>
          )}

          {selected.delivery && (
            <Card variant="standard" className="p-2.5">
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Delivery</span>
              <p className={cn("text-sm font-bold",
                selected.delivery === "Delivered" ? "text-emerald-600" : "text-amber-600"
              )}>{selected.delivery}</p>
            </Card>
          )}

          <Card variant={isSlaBreached(selected) ? "danger" : "standard"} className="flex items-center justify-between p-2.5">
            <div>
              <span className="text-[9px] text-text-tertiary uppercase tracking-[0.06em]">Days in Stage</span>
              <p className={cn("text-sm font-bold", isSlaBreached(selected) ? "text-red-500" : "text-text-primary")}>{getDaysInStage(selected)}</p>
            </div>
            {isSlaBreached(selected) && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </Card>

          {selected.date && (
            <Card variant="standard" className="p-2 text-[10px] text-text-tertiary">
              Date: {selected.date}
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
