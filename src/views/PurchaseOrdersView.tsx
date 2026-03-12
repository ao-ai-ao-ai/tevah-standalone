import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, FileText, Send, CheckCircle2, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";

type VPOStatus = "draft" | "sent" | "confirmed" | "fulfilled" | "issue";

interface VPO {
  id: string;
  dealNumber: string;
  vendor: string;
  brand: string;
  customer: string;
  amount: number;
  sellAmount: number;
  status: VPOStatus;
  stage: string;
  spread: number;
  margin: number;
  date: string;
}

function deriveVPOs(): VPO[] {
  return ALL_DEALS
    .filter(d => d.buyTotal > 0 && !["Lost", "Not sent yet"].includes(d.stage))
    .map(d => {
      let status: VPOStatus = "draft";
      if (["Won", "won- need payment"].includes(d.stage)) status = "fulfilled";
      else if (["Invoiced", "Logistics"].includes(d.stage)) status = "confirmed";
      else if (["Confirmed"].includes(d.stage)) status = "sent";
      else if (d.stage === "Need Confirmation") status = "draft";

      return {
        id: `vpo-${d.id}`,
        dealNumber: d.dealNumber,
        vendor: d.vendor,
        brand: d.brand,
        customer: d.customer,
        amount: d.buyTotal,
        sellAmount: d.sellTotal,
        status,
        stage: d.stage,
        spread: d.spread,
        margin: d.margin,
        date: d.date || "",
      };
    });
}

type Tab = "all" | "draft" | "sent" | "confirmed" | "fulfilled";

export function PurchaseOrdersView() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const vpos = useMemo(() => deriveVPOs(), []);

  const filtered = useMemo(() => {
    let list = vpos;
    if (tab !== "all") list = list.filter(v => v.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.dealNumber.toLowerCase().includes(q) ||
        v.vendor.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.customer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vpos, tab, search]);

  const stats = useMemo(() => {
    const totalValue = vpos.reduce((s, v) => s + v.amount, 0);
    const totalSpread = vpos.reduce((s, v) => s + v.spread, 0);
    return {
      total: vpos.length,
      totalValue,
      totalSpread,
      draft: vpos.filter(v => v.status === "draft").length,
      sent: vpos.filter(v => v.status === "sent").length,
      confirmed: vpos.filter(v => v.status === "confirmed").length,
      fulfilled: vpos.filter(v => v.status === "fulfilled").length,
    };
  }, [vpos]);

  const statusBadge = (s: VPOStatus) => {
    const config: Record<VPOStatus, { label: string; cls: string }> = {
      draft: { label: "Draft", cls: "text-text-tertiary bg-canvas" },
      sent: { label: "Sent", cls: "text-blue-700 bg-blue-50" },
      confirmed: { label: "Confirmed", cls: "text-purple-700 bg-purple-50" },
      fulfilled: { label: "Fulfilled", cls: "text-emerald-700 bg-emerald-50" },
      issue: { label: "Issue", cls: "text-red-700 bg-red-50" },
    };
    const c = config[s];
    return <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", c.cls)}>{c.label}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Purchase Orders (VPOs)</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {stats.total} VPOs &mdash; {formatCurrency(stats.totalValue)} total &mdash; {formatCurrency(stats.totalSpread)} spread
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search VPOs..."
              className="h-8 pl-8 pr-3 w-56 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total VPOs", value: stats.total.toString(), icon: FileText, color: "text-blue-600", iconBg: "bg-blue-50" },
            { label: "Total Value", value: formatCurrency(stats.totalValue), icon: DollarSign, color: "text-purple-600", iconBg: "bg-purple-50" },
            { label: "Pending Send", value: stats.draft.toString(), icon: Clock, color: "text-amber-600", iconBg: "bg-amber-50" },
            { label: "Total Spread", value: formatCurrency(stats.totalSpread), icon: CheckCircle2, color: "text-emerald-600", iconBg: "bg-emerald-50" },
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

        <div className="flex gap-1">
          {([
            { key: "all" as Tab, label: "All", count: stats.total },
            { key: "draft" as Tab, label: "Draft", count: stats.draft },
            { key: "sent" as Tab, label: "Sent", count: stats.sent },
            { key: "confirmed" as Tab, label: "Confirmed", count: stats.confirmed },
            { key: "fulfilled" as Tab, label: "Fulfilled", count: stats.fulfilled },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === t.key ? "bg-purple-100 text-purple-700" : "text-text-tertiary hover:text-text-secondary hover:bg-white"
              )}>
              {t.label}
              <span className={cn("ml-1.5 text-[10px] tabular-nums", tab === t.key ? "text-purple-500" : "text-text-disabled")}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Card variant="standard" className="mx-4 mt-4 mb-4 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-divider">
                {["VPO #", "Vendor", "Brand", "Customer", "Amount", "Sell", "Spread", "Margin", "Status", "Stage"].map(h => (
                  <th key={h} className="text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-text-tertiary text-sm">No VPOs match your filters.</td></tr>
              )}
              {filtered.map((v, i) => (
                <motion.tr key={v.id}
                  initial={i < 40 ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.008, 0.3) }}
                  className="border-b border-divider hover:bg-hover cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono text-text-secondary">VPO-{v.dealNumber}</td>
                  <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-[160px]">{v.vendor}</td>
                  <td className="px-3 py-2.5 text-text-secondary truncate max-w-[120px]">{v.brand}</td>
                  <td className="px-3 py-2.5 text-text-tertiary truncate max-w-[140px]">{v.customer}</td>
                  <td className="px-3 py-2.5 font-mono text-text-primary tabular-nums font-medium">{formatCurrency(v.amount)}</td>
                  <td className="px-3 py-2.5 font-mono text-text-secondary tabular-nums">{formatCurrency(v.sellAmount)}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("font-mono tabular-nums", v.spread >= 0 ? "text-emerald-600" : "text-red-500")}>{formatCurrency(v.spread)}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("font-mono tabular-nums", v.margin >= 15 ? "text-emerald-600" : v.margin >= 10 ? "text-amber-600" : "text-red-500")}>{v.margin > 0 ? `${v.margin}%` : "--"}</span>
                  </td>
                  <td className="px-3 py-2.5">{statusBadge(v.status)}</td>
                  <td className="px-3 py-2.5"><StagePill stage={v.stage} size="xs" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export default PurchaseOrdersView;
