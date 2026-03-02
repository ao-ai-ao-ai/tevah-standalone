import { motion } from "motion/react";
import { AlertTriangle, TrendingUp, DollarSign, Package, Users, ArrowUpRight, Clock } from "lucide-react";
import { ORDERS, CUSTOMERS, EMAILS, STAGE_PIPELINE } from "../data/emails";
import { cn, formatCurrency } from "../lib/utils";

export default function DashboardView({ onNavigate }: { onNavigate: (section: string, id?: string) => void }) {
  const activeOrders = ORDERS.filter(o => o.stageCode !== "B13" && o.stageCode !== "B15");
  const breached = ORDERS.filter(o => o.slaBreached);
  const totalPipeline = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalRevenue = ORDERS.reduce((s, o) => s + o.totalAmount, 0);
  const avgMargin = ORDERS.filter(o => o.margin > 0).reduce((s, o) => s + o.margin, 0) / ORDERS.filter(o => o.margin > 0).length;
  const unreadEmails = EMAILS.filter(e => e.isUnread).length;
  const urgentEmails = EMAILS.filter(e => e.urgency === "urgent");
  const overduePayments = ORDERS.filter(o => o.payment === "Overdue");

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Morning Briefing */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-lg font-semibold text-white">Good afternoon, Gil</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {unreadEmails} unread emails. {activeOrders.length} active orders ({breached.length} SLA breaches). {overduePayments.length} overdue payments.
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${ORDERS.length} deals`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Active Pipeline", value: formatCurrency(totalPipeline), sub: `${activeOrders.length} in-flight`, icon: Package, color: "text-violet-400" },
            { label: "Avg Margin", value: `${avgMargin.toFixed(1)}%`, sub: "across all deals", icon: TrendingUp, color: "text-amber-400" },
            { label: "Customers", value: String(CUSTOMERS.length), sub: `${formatCurrency(CUSTOMERS.reduce((s, c) => s + c.totalRevenue, 0))} lifetime`, icon: Users, color: "text-blue-400" },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/40"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{metric.label}</span>
                <metric.icon className={cn("w-4 h-4", metric.color)} />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{metric.value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{metric.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Urgent Attention */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-zinc-900/50 border border-zinc-800/40 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-white">Needs Attention</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">{breached.length + urgentEmails.length}</span>
            </div>
            <div className="space-y-2">
              {urgentEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => onNavigate("inbox", email.id)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-400">{email.aiCategory}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">{email.company} — {email.subject.slice(0, 60)}</p>
                </button>
              ))}
              {breached.map(order => (
                <button
                  key={order.id}
                  onClick={() => onNavigate("orders", order.id)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className="text-xs font-medium text-red-400">SLA Breach — {order.daysInStage}d</span>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5">#{order.orderNumber} — {order.brand} for {order.customer} ({formatCurrency(order.totalAmount)})</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Overdue Payments */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-zinc-900/50 border border-zinc-800/40 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white">Overdue Payments</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{overduePayments.length}</span>
            </div>
            <div className="space-y-2">
              {overduePayments.map(order => (
                <button
                  key={order.id}
                  onClick={() => onNavigate("orders", order.id)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500">#{order.orderNumber}</span>
                    <span className="text-xs font-bold text-white tabular-nums">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{order.customer} — {order.brand}</p>
                </button>
              ))}
              {overduePayments.length === 0 && (
                <p className="text-xs text-zinc-600 py-2">All payments current</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pipeline by Stage */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl bg-zinc-900/50 border border-zinc-800/40 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white">Pipeline Stages</span>
            <button onClick={() => onNavigate("pipeline")} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
              View Pipeline →
            </button>
          </div>
          <div className="flex gap-1.5">
            {STAGE_PIPELINE.filter(s => s.code !== "B13" && s.code !== "B15").map(stage => {
              const count = ORDERS.filter(o => o.stageCode === stage.code).length;
              const value = ORDERS.filter(o => o.stageCode === stage.code).reduce((s, o) => s + o.totalAmount, 0);
              if (count === 0) return null;
              return (
                <button
                  key={stage.code}
                  onClick={() => onNavigate("pipeline")}
                  className="flex-1 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors text-center"
                >
                  <span className={cn("text-[9px] font-mono font-bold px-1 py-0.5 rounded", stage.bgColor, stage.color)}>{stage.code}</span>
                  <p className="text-lg font-bold text-white tabular-nums mt-1">{count}</p>
                  <p className="text-[9px] text-zinc-600 tabular-nums">{formatCurrency(value)}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-zinc-900/50 border border-zinc-800/40 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white">Top Customers by Revenue</span>
            <button onClick={() => onNavigate("customers")} className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
              View All →
            </button>
          </div>
          <div className="space-y-1.5">
            {CUSTOMERS.slice(0, 5).map((cust, i) => (
              <button
                key={cust.id}
                onClick={() => onNavigate("customers", cust.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
              >
                <span className="text-[10px] text-zinc-600 font-mono w-4">{i + 1}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-200">{cust.name}</span>
                    <span className={cn("text-[8px] px-1 py-0.5 rounded-full font-medium",
                      cust.tier === "Platinum" ? "bg-violet-500/10 text-violet-400" :
                      cust.tier === "Gold" ? "bg-amber-500/10 text-amber-400" :
                      "bg-zinc-500/10 text-zinc-400"
                    )}>{cust.tier}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">{cust.deals} deals — {cust.openOrders} open</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white tabular-nums">{formatCurrency(cust.totalRevenue)}</p>
                  <span className={cn("text-[9px] tabular-nums", cust.avgMargin >= 15 ? "text-emerald-400" : cust.avgMargin >= 10 ? "text-amber-400" : "text-zinc-500")}>
                    {cust.avgMargin}% margin
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
