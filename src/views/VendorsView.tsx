import { useState } from "react";
import { motion } from "motion/react";
import { VENDORS, ORDERS } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";

export default function VendorsView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = VENDORS.find(v => v.id === selectedId);

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Vendors</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{VENDORS.length} vendors — {formatCurrency(VENDORS.reduce((s, v) => s + v.revenue, 0))} sourced</p>
          </div>
        </div>

        <div className="space-y-2">
          {VENDORS.map((vendor, i) => (
            <motion.button
              key={vendor.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedId(selectedId === vendor.id ? null : vendor.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-all",
                selectedId === vendor.id
                  ? "bg-violet-500/5 border-violet-500/20"
                  : "bg-zinc-900/40 border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-800/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-300">{vendor.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{vendor.name}</p>
                    <p className="text-[10px] text-zinc-500">{vendor.deals} deals — {vendor.topBrands.slice(0, 3).join(", ")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(vendor.revenue)}</p>
                  <span className="text-[10px] text-zinc-600">sourced value</span>
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-orange-300">{selected.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-white">{selected.name}</p>
                <p className="text-xs text-zinc-500">{selected.deals} deals</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                <span className="text-[9px] text-zinc-600 uppercase">Total Sourced</span>
                <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(selected.revenue)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                <span className="text-[9px] text-zinc-600 uppercase">Total Deals</span>
                <p className="text-sm font-bold text-white">{selected.deals}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Brands</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.topBrands.map(brand => (
                  <span key={brand} className="text-[10px] px-2 py-1 rounded-md bg-zinc-800/60 text-zinc-300 border border-zinc-700/30">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Recent Orders via {selected.name}</span>
              <div className="mt-2 space-y-1.5">
                {ORDERS.filter(o => o.vendor === selected.name || o.vendor.toLowerCase().includes(selected.name.toLowerCase().split(" ")[0])).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-zinc-800/30 transition-colors">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400">#{order.orderNumber}</span>
                      <span className="ml-1 text-[10px] text-zinc-500">{order.brand}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono tabular-nums">{formatCurrency(order.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
