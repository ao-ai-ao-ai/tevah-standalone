/**
 * FinanceView — Real QB financials: AR aging, AP, risk customers
 */

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn, formatCurrency, formatCurrencyExact } from "../lib/utils";
import { useUnifiedData } from "../lib/use-unified";
import { DollarSign, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Shield } from "lucide-react";

export default function FinanceView() {
  const { data, loading } = useUnifiedData();

  const fin = useMemo(() => {
    const { kpis, invoices, bills, customers } = data;
    const now = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0 };
    const overdueInvoices: typeof invoices = [];

    for (const inv of invoices) {
      if (inv.balance <= 0) continue;
      const daysLate = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000);
      if (daysLate <= 0) aging.current += inv.balance;
      else if (daysLate <= 30) { aging.days30 += inv.balance; overdueInvoices.push(inv); }
      else if (daysLate <= 60) { aging.days60 += inv.balance; overdueInvoices.push(inv); }
      else { aging.days90 += inv.balance; overdueInvoices.push(inv); }
    }
    const totalAging = aging.current + aging.days30 + aging.days60 + aging.days90;

    const custAR = new Map<string, number>();
    for (const inv of invoices) { if (inv.balance > 0) custAR.set(inv.customer, (custAR.get(inv.customer) || 0) + inv.balance); }
    const topCustAR = [...custAR.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([name, amount]) => ({ name, amount, overdue: overdueInvoices.some(i => i.customer === name) }));

    const vendAP = new Map<string, number>();
    for (const bill of bills) { if (bill.balance > 0) vendAP.set(bill.vendor, (vendAP.get(bill.vendor) || 0) + bill.balance); }
    const topVendAP = [...vendAP.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, amount]) => ({ name, amount }));

    const riskCustomers = customers.filter(c => c.qb && c.qb.pctUnpaid >= 50 && c.qb.totalUnpaid > 5000)
      .sort((a, b) => (b.qb?.totalUnpaid ?? 0) - (a.qb?.totalUnpaid ?? 0)).slice(0, 5);

    return { ...kpis, aging, totalAging, topCustAR, topVendAP, riskCustomers,
      overdueInvoiceCount: overdueInvoices.length, overdueTotal: overdueInvoices.reduce((s, i) => s + i.balance, 0),
      paidBills: bills.filter(b => b.status === "paid").length };
  }, [data]);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Finance</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data.qbLoaded ? "Real QuickBooks data" : "Monday.com estimates"} — {fin.dealCount} deals, {fin.invoiceCount} invoices, {fin.billCount} bills</p>
        </div>
        {data.qbLoaded && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">QB Live</span>}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: formatCurrency(fin.totalInvoiced), icon: ArrowUpRight, color: "text-blue-400" },
          { label: "Total Billed", value: formatCurrency(fin.totalBilled), icon: ArrowDownRight, color: "text-violet-400" },
          { label: "Gross Spread", value: formatCurrency(fin.grossSpread), icon: DollarSign, color: fin.grossSpread >= 0 ? "text-emerald-400" : "text-red-400" },
          { label: "Net Position", value: formatCurrency(fin.netPosition), icon: TrendingUp, color: fin.netPosition >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map(kpi => (
          <div key={kpi.label} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{kpi.label}</span>
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
            </div>
            <p className={cn("text-xl font-mono font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* AR Aging */}
        <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">AR Aging</h3>
            <span className="text-sm font-mono font-bold text-white">{formatCurrency(fin.totalAR)}</span>
          </div>
          {fin.totalAging > 0 && (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-zinc-800">
                {[
                  { value: fin.aging.current, color: "bg-emerald-400" },
                  { value: fin.aging.days30, color: "bg-blue-400" },
                  { value: fin.aging.days60, color: "bg-amber-400" },
                  { value: fin.aging.days90, color: "bg-red-400" },
                ].map((bucket, i) => {
                  const pct = (bucket.value / fin.totalAging) * 100;
                  return pct > 0 ? <div key={i} className={cn("h-full", bucket.color)} style={{ width: `${pct}%` }} /> : null;
                })}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { color: "bg-emerald-400", label: "Current", value: fin.aging.current },
                  { color: "bg-blue-400", label: "1-30d", value: fin.aging.days30 },
                  { color: "bg-amber-400", label: "31-60d", value: fin.aging.days60 },
                  { color: "bg-red-400", label: "61d+", value: fin.aging.days90 },
                ].map(l => (
                  <div key={l.label} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <div className={cn("w-2 h-2 rounded-full", l.color)} />
                      <span className="text-[9px] text-zinc-500">{l.label}</span>
                    </div>
                    <p className="text-[11px] font-mono font-medium text-zinc-300">{formatCurrency(l.value)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {fin.overdueTotal > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-red-400 font-medium">{formatCurrency(fin.overdueTotal)} overdue</p>
                <p className="text-[10px] text-zinc-500">{fin.overdueInvoiceCount} invoices past due</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {fin.topCustAR.map(c => (
              <div key={c.name} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                <div className="flex items-center gap-2">
                  {c.overdue && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                  <span className="text-xs text-zinc-300 truncate max-w-[180px]">{c.name}</span>
                </div>
                <span className={cn("text-xs font-mono tabular-nums", c.overdue ? "text-red-400" : "text-zinc-400")}>{formatCurrencyExact(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AP + Risk */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Accounts Payable</h3>
              <span className="text-sm font-mono font-bold text-white">{formatCurrency(fin.totalAP)}</span>
            </div>
            <div className="space-y-2">
              {fin.topVendAP.map(v => (
                <div key={v.name} className="flex items-center justify-between py-1.5 border-b border-zinc-800/30 last:border-0">
                  <span className="text-xs text-zinc-300 truncate max-w-[180px]">{v.name}</span>
                  <span className="text-xs font-mono tabular-nums text-zinc-400">{formatCurrencyExact(v.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {fin.riskCustomers.length > 0 && (
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
              <div className="flex items-center gap-1.5 mb-3">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400">Payment Risk</h3>
              </div>
              <div className="space-y-2">
                {fin.riskCustomers.map(c => (
                  <div key={c.name} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-200">{c.name}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                        c.risk === "critical" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                      )}>{c.risk}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span>Unpaid: <span className="text-red-400 font-medium">{formatCurrency(c.qb?.totalUnpaid ?? 0)}</span></span>
                      <span>{c.qb?.pctUnpaid.toFixed(0)}% outstanding</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
