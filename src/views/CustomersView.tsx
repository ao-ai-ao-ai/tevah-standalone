import { useState } from "react";
import { motion } from "motion/react";
import { CUSTOMERS, ORDERS, STAGE_PIPELINE } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";

export default function CustomersView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CUSTOMERS.find(c => c.id === selectedId);

  return (
    <div className="h-full flex">
      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Customers</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{CUSTOMERS.length} accounts — {formatCurrency(CUSTOMERS.reduce((s, c) => s + c.totalRevenue, 0))} lifetime revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {CUSTOMERS.map((cust, i) => (
            <motion.button
              key={cust.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedId(selectedId === cust.id ? null : cust.id)}
              className={cn(
                "text-left p-4 rounded-xl border transition-all",
                selectedId === cust.id
                  ? "bg-violet-500/5 border-violet-500/20"
                  : "bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-800/30"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-violet-300">{cust.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{cust.name}</p>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                      cust.tier === "Platinum" ? "bg-violet-500/10 text-violet-400" :
                      cust.tier === "Gold" ? "bg-amber-500/10 text-amber-400" :
                      cust.tier === "Silver" ? "bg-zinc-500/10 text-zinc-400" :
                      "bg-zinc-800 text-zinc-500"
                    )}>{cust.tier}</span>
                  </div>
                </div>

                {/* Health */}
                {cust.healthScore > 0 && (
                  <div className={cn("text-lg font-bold tabular-nums",
                    cust.healthScore >= 80 ? "text-emerald-400" :
                    cust.healthScore >= 60 ? "text-amber-400" : "text-red-400"
                  )}>
                    {cust.healthScore}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-zinc-600">Revenue</span>
                  <p className="text-xs font-semibold text-zinc-200 tabular-nums">{cust.totalRevenue > 0 ? formatCurrency(cust.totalRevenue) : "—"}</p>
                </div>
                <div>
                  <span className="text-zinc-600">Avg Margin</span>
                  <p className={cn("text-xs font-semibold tabular-nums", cust.avgMargin >= 15 ? "text-emerald-400" : cust.avgMargin >= 10 ? "text-amber-400" : "text-zinc-400")}>
                    {cust.avgMargin > 0 ? `${cust.avgMargin}%` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-600">Deals</span>
                  <p className="text-xs font-semibold text-zinc-200">{cust.deals} ({cust.wonDeals} won)</p>
                </div>
                <div>
                  <span className="text-zinc-600">Open Orders</span>
                  <p className="text-xs font-semibold text-zinc-200">{cust.openOrders}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 360, opacity: 1 }}
          className="flex-none w-[360px] border-l border-zinc-800/60 overflow-y-auto"
        >
          <div className="p-4 border-b border-zinc-800/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-violet-300">{selected.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-white">{selected.name}</p>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  selected.tier === "Platinum" ? "bg-violet-500/10 text-violet-400" :
                  selected.tier === "Gold" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"
                )}>{selected.tier}</span>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Health bar */}
            {selected.healthScore > 0 && (
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Health Score</span>
                  <span className={cn("text-2xl font-bold tabular-nums",
                    selected.healthScore >= 80 ? "text-emerald-400" :
                    selected.healthScore >= 60 ? "text-amber-400" : "text-red-400"
                  )}>{selected.healthScore}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selected.healthScore}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    className={cn("h-full rounded-full",
                      selected.healthScore >= 80 ? "bg-emerald-500" :
                      selected.healthScore >= 60 ? "bg-amber-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Financial summary */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Lifetime Revenue", value: selected.totalRevenue > 0 ? formatCurrency(selected.totalRevenue) : "—" },
                { label: "Total Profit", value: selected.totalProfit > 0 ? formatCurrency(selected.totalProfit) : "—" },
                { label: "Avg Margin", value: selected.avgMargin > 0 ? `${selected.avgMargin}%` : "—" },
                { label: "Total Deals", value: `${selected.deals} (${selected.wonDeals} won)` },
                { label: "Open Orders", value: String(selected.openOrders) },
                { label: "Last Order", value: selected.lastOrder },
              ].map(m => (
                <div key={m.label} className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{m.label}</span>
                  <p className="text-sm font-semibold text-zinc-200 tabular-nums mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Recent orders for this customer */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Orders</span>
              <div className="mt-2 space-y-1.5">
                {ORDERS.filter(o => o.customer === selected.name).map(order => {
                  const stageInfo = STAGE_PIPELINE.find(s => s.code === order.stageCode);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800/30 transition-colors">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400">#{order.orderNumber}</span>
                        <span className={cn("ml-2 text-[9px] px-1 py-0.5 rounded",
                          stageInfo?.bgColor,
                          stageInfo?.color
                        )}>{order.stageCode}</span>
                        <span className="ml-1 text-[10px] text-zinc-500">{order.brand}</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono tabular-nums">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  );
                })}
                {ORDERS.filter(o => o.customer === selected.name).length === 0 && (
                  <p className="text-xs text-zinc-600 py-2">No orders in top 30</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
