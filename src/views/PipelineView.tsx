import { motion } from "motion/react";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { ORDERS, STAGE_PIPELINE } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";

export default function PipelineView({ onNavigateToOrder }: { onNavigateToOrder: (id: string) => void }) {
  // Exclude Won (B13) and Lost (B15) from pipeline — those are completed
  const pipelineStages = STAGE_PIPELINE.filter(s => s.code !== "B13" && s.code !== "B15");

  const grouped = pipelineStages.map(stage => ({
    ...stage,
    orders: ORDERS.filter(o => o.stageCode === stage.code),
  })).filter(s => s.orders.length > 0);

  const activeOrders = ORDERS.filter(o => o.stageCode !== "B13" && o.stageCode !== "B15");
  const totalValue = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const breached = activeOrders.filter(o => o.slaBreached).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Pipeline</h1>
            <p className="text-xs text-zinc-500 mt-0.5">B1-B15 Leviathan Stage Engine — {activeOrders.length} active orders</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Pipeline</p>
              <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(totalValue)}</p>
            </div>
            {breached > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">{breached} SLA breach{breached > 1 ? "es" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max h-full">
          {grouped.map((stage, si) => (
            <motion.div
              key={stage.code}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="w-[280px] flex-none flex flex-col rounded-xl bg-zinc-900/40 border border-zinc-800/40"
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800/30">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded", stage.bgColor, stage.color)}>
                    {stage.code}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{stage.name}</span>
                </div>
                <span className="text-[10px] text-zinc-600 tabular-nums">{stage.orders.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stage.orders.map((order, oi) => (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: si * 0.05 + oi * 0.03 }}
                    onClick={() => onNavigateToOrder(order.id)}
                    className="w-full text-left p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-800/40 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">#{order.orderNumber}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                    </div>
                    <p className="text-xs font-medium text-zinc-200 mb-0.5">{order.customer}</p>
                    <p className="text-[10px] text-zinc-500">{order.brand}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-white tabular-nums">{formatCurrency(order.totalAmount)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[9px] font-mono tabular-nums", order.margin >= 15 ? "text-emerald-400" : order.margin >= 10 ? "text-amber-400" : "text-red-400")}>
                          {order.margin}%
                        </span>
                        {order.slaBreached && (
                          <span className="flex items-center gap-0.5 text-[9px] text-red-400">
                            <Clock className="w-2.5 h-2.5" />{order.daysInStage}d
                          </span>
                        )}
                      </div>
                    </div>
                    {order.payment && order.payment !== "Received" && (
                      <div className={cn("mt-1.5 text-[9px] px-1.5 py-0.5 rounded inline-block",
                        order.payment === "Overdue" ? "bg-red-500/10 text-red-400" :
                        order.payment === "Partially Received" ? "bg-amber-500/10 text-amber-400" :
                        "bg-zinc-800 text-zinc-500"
                      )}>
                        {order.payment}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Column footer */}
              <div className="flex-none px-3 py-2 border-t border-zinc-800/30 text-[10px] text-zinc-600 tabular-nums">
                {formatCurrency(stage.orders.reduce((s, o) => s + o.totalAmount, 0))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
