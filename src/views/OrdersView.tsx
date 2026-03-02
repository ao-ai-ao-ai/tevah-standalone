import { useState } from "react";
import { motion } from "motion/react";
import { Search, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, Mail } from "lucide-react";
import { ORDERS, STAGE_PIPELINE } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";

type SortField = "orderNumber" | "customer" | "totalAmount" | "margin" | "stage" | "date";

export default function OrdersView({ onNavigateToEmail, selectedOrderId }: { onNavigateToEmail: (emailId: string) => void; selectedOrderId?: string | null }) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(selectedOrderId || null);

  const filtered = ORDERS.filter(o =>
    !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase()) ||
    o.brand.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    switch (sortField) {
      case "totalAmount": return (a.totalAmount - b.totalAmount) * mul;
      case "margin": return (a.margin - b.margin) * mul;
      default: return 0;
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const selected = ORDERS.find(o => o.id === selectedId);

  const SortIcon = ({ field }: { field: SortField }) => (
    sortField === field
      ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ArrowUpDown className="w-3 h-3 text-zinc-700" />
  );

  return (
    <div className="h-full flex">
      {/* Table */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-none px-6 py-4 border-b border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-white">Orders</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{ORDERS.length} deals — {formatCurrency(ORDERS.reduce((s, o) => s + o.totalAmount, 0))} total value</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
                className="h-8 pl-8 pr-3 w-56 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-zinc-950 z-10">
              <tr className="border-b border-zinc-800/60">
                {[
                  { field: "orderNumber" as SortField, label: "Order #", w: "w-28" },
                  { field: "customer" as SortField, label: "Customer", w: "" },
                  { field: "stage" as SortField, label: "Stage", w: "w-32" },
                  { field: "totalAmount" as SortField, label: "Amount", w: "w-28" },
                  { field: "margin" as SortField, label: "Margin", w: "w-20" },
                  { field: "date" as SortField, label: "Date", w: "w-20" },
                ].map(col => (
                  <th key={col.field} className={cn("text-left font-medium text-zinc-500 px-4 py-2.5 cursor-pointer hover:text-zinc-300 transition-colors", col.w)} onClick={() => toggleSort(col.field)}>
                    <div className="flex items-center gap-1">
                      {col.label} <SortIcon field={col.field} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => {
                const stageInfo = STAGE_PIPELINE.find(s => s.code === order.stageCode);
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedId(selectedId === order.id ? null : order.id)}
                    className={cn(
                      "border-b border-zinc-800/20 cursor-pointer transition-colors",
                      selectedId === order.id ? "bg-violet-500/5" : "hover:bg-zinc-800/30"
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-zinc-400">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-200">{order.customer}</span>
                      <span className="text-zinc-600 ml-2">{order.brand}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", stageInfo?.bgColor, stageInfo?.color)}>
                          {order.stageCode}
                        </span>
                        <span className="text-zinc-400 text-[11px]">{order.stage}</span>
                        {order.slaBreached && <AlertTriangle className="w-3 h-3 text-red-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-200 tabular-nums">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("font-mono tabular-nums", order.margin >= 15 ? "text-emerald-400" : order.margin >= 10 ? "text-amber-400" : "text-red-400")}>
                        {order.margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{order.date}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          className="flex-none w-[340px] border-l border-zinc-800/60 overflow-y-auto p-4 space-y-4"
        >
          <div>
            <p className="text-xs font-mono text-zinc-500">#{selected.orderNumber}</p>
            <p className="text-sm font-semibold text-white mt-0.5">{selected.customer}</p>
            <p className="text-xs text-zinc-500">{selected.brand} via {selected.vendor || "Direct"}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Revenue</span>
              <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Cost</span>
              <p className="text-sm font-bold text-zinc-300 tabular-nums">{formatCurrency(selected.cost)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Margin</span>
              <p className={cn("text-sm font-bold tabular-nums", selected.margin >= 15 ? "text-emerald-400" : selected.margin >= 10 ? "text-amber-400" : "text-red-400")}>{selected.margin}%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Days in Stage</span>
              <p className={cn("text-sm font-bold", selected.slaBreached ? "text-red-400" : "text-white")}>{selected.daysInStage}</p>
            </div>
          </div>

          {selected.payment && (
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Payment Status</span>
              <p className={cn("text-sm font-bold",
                selected.payment === "Received" ? "text-emerald-400" :
                selected.payment === "Overdue" ? "text-red-400" :
                selected.payment === "Partially Received" ? "text-amber-400" :
                "text-zinc-300"
              )}>{selected.payment}</p>
            </div>
          )}

          {selected.delivery && (
            <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <span className="text-[9px] text-zinc-600 uppercase">Delivery</span>
              <p className={cn("text-sm font-bold",
                selected.delivery === "Delivered" ? "text-emerald-400" : "text-amber-400"
              )}>{selected.delivery}</p>
            </div>
          )}

          {selected.mondayId && (
            <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/40 text-[10px] text-zinc-500">
              Monday ID: {selected.mondayId}
            </div>
          )}

          {selected.sourceEmailId && (
            <button onClick={() => onNavigateToEmail(selected.sourceEmailId!)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-400 rounded-lg hover:bg-violet-500/10 transition-colors border border-violet-500/20">
              <Mail className="w-3.5 h-3.5" /> View Source Email
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
