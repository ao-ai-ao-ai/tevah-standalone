/**
 * InvoicesView — REAL QuickBooks invoices & bills
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, ArrowUpRight, ArrowDownLeft, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { useUnifiedData } from "../lib/use-unified";
import { cn, formatCurrency, formatCurrencyExact } from "../lib/utils";
import type { QBInvoice, QBBill } from "../lib/qb-types";

type Tab = "all" | "ar" | "ap" | "overdue" | "paid";

interface InvoiceRow {
  id: string; docNumber: string; type: "invoice" | "bill"; counterparty: string;
  date: string; dueDate: string; total: number; balance: number; status: "paid" | "unpaid";
  lines: Array<{ item: string; qty: number; rate: number; amount: number }>;
}

function toRow(inv: QBInvoice): InvoiceRow {
  return { id: inv.id, docNumber: inv.docNumber, type: "invoice", counterparty: inv.customer, date: inv.date, dueDate: inv.dueDate, total: inv.total, balance: inv.balance, status: inv.status, lines: inv.lines };
}
function toRowBill(bill: QBBill): InvoiceRow {
  return { id: bill.id, docNumber: bill.docNumber, type: "bill", counterparty: bill.vendor, date: bill.date, dueDate: bill.dueDate, total: bill.total, balance: bill.balance, status: bill.status, lines: bill.lines };
}
function isOverdue(row: InvoiceRow): boolean {
  if (row.status === "paid" || row.balance <= 0) return false;
  return new Date(row.dueDate) < new Date();
}
function formatDate(d: string): string {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export function InvoicesView() {
  const { data, loading } = useUnifiedData();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allRows = useMemo(() => {
    if (!data.qbLoaded) return [];
    return [...data.invoices.map(toRow), ...data.bills.map(toRowBill)].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const filtered = useMemo(() => {
    let list = allRows;
    if (tab === "ar") list = list.filter(r => r.type === "invoice");
    if (tab === "ap") list = list.filter(r => r.type === "bill");
    if (tab === "overdue") list = list.filter(isOverdue);
    if (tab === "paid") list = list.filter(r => r.status === "paid");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.docNumber.toLowerCase().includes(q) || r.counterparty.toLowerCase().includes(q));
    }
    return list;
  }, [allRows, tab, search]);

  const stats = useMemo(() => {
    const invoices = allRows.filter(r => r.type === "invoice");
    const bills = allRows.filter(r => r.type === "bill");
    const overdue = allRows.filter(isOverdue);
    return {
      arBalance: invoices.reduce((s, r) => s + r.balance, 0),
      arTotal: invoices.reduce((s, r) => s + r.total, 0),
      apBalance: bills.reduce((s, r) => s + r.balance, 0),
      apTotal: bills.reduce((s, r) => s + r.total, 0),
      overdueTotal: overdue.reduce((s, r) => s + r.balance, 0),
      overdueCount: overdue.length,
      invoiceCount: invoices.length,
      billCount: bills.length,
    };
  }, [allRows]);

  if (loading || !data.qbLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-500">Loading QuickBooks data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-white">Invoices & Bills</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{stats.invoiceCount} invoices ({formatCurrency(stats.arTotal)}) + {stats.billCount} bills ({formatCurrency(stats.apTotal)}) from QuickBooks</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..."
              className="h-8 pl-8 pr-3 w-64 text-xs bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Receivable (AR)", value: formatCurrency(stats.arBalance), sub: `of ${formatCurrency(stats.arTotal)}`, icon: ArrowUpRight, color: "text-blue-400" },
            { label: "Payable (AP)", value: formatCurrency(stats.apBalance), sub: `of ${formatCurrency(stats.apTotal)}`, icon: ArrowDownLeft, color: "text-violet-400" },
            { label: "Overdue", value: formatCurrency(stats.overdueTotal), sub: `${stats.overdueCount} past due`, icon: AlertTriangle, color: "text-red-400" },
            { label: "Net Position", value: formatCurrency(stats.arBalance - stats.apBalance), sub: "AR minus AP", icon: CheckCircle2, color: stats.arBalance - stats.apBalance >= 0 ? "text-emerald-400" : "text-red-400" },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
              <div className="flex items-center gap-2 mb-1.5">
                <m.icon className={cn("w-3 h-3", m.color)} />
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className={cn("text-lg font-bold tabular-nums", m.color)}>{m.value}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1">
          {([
            { key: "all" as Tab, label: "All", count: allRows.length },
            { key: "ar" as Tab, label: "Invoices (AR)", count: stats.invoiceCount },
            { key: "ap" as Tab, label: "Bills (AP)", count: stats.billCount },
            { key: "overdue" as Tab, label: "Overdue", count: stats.overdueCount },
            { key: "paid" as Tab, label: "Paid", count: allRows.filter(r => r.status === "paid").length },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                tab === t.key ? "bg-violet-500/10 text-violet-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              )}>
              {t.label} <span className={cn("ml-1.5 text-[10px] tabular-nums", tab === t.key ? "text-violet-400" : "text-zinc-600")}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-zinc-950 z-10">
            <tr className="border-b border-zinc-800/60">
              {["", "Type", "Doc #", "Counterparty", "Date", "Due", "Total", "Balance", "Status"].map(h => (
                <th key={h} className="text-left font-medium text-zinc-600 text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-600 text-sm">No records match your filters.</td></tr>
            )}
            {filtered.map((row, i) => {
              const od = isOverdue(row);
              const expanded = expandedId === row.id;
              return (
                <motion.tr key={row.id}
                  initial={i < 40 ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.006, 0.2) }}
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                  className={cn("border-b border-zinc-800/20 cursor-pointer transition-colors",
                    expanded ? "bg-violet-500/5" : "hover:bg-zinc-800/30", od && "bg-red-500/3"
                  )}>
                  <td className="px-3 py-2.5 w-6">
                    {row.lines.length > 0 && (expanded ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronRight className="w-3 h-3 text-zinc-600" />)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                      row.type === "invoice" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"
                    )}>
                      {row.type === "invoice" ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                      {row.type === "invoice" ? "INV" : "BILL"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-zinc-400">{row.docNumber || "--"}</td>
                  <td className="px-3 py-2.5 text-zinc-200 font-medium truncate max-w-[200px]">{row.counterparty}</td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap">{formatDate(row.date)}</td>
                  <td className={cn("px-3 py-2.5 whitespace-nowrap", od ? "text-red-400 font-medium" : "text-zinc-500")}>{formatDate(row.dueDate)}</td>
                  <td className="px-3 py-2.5 font-mono text-zinc-200 tabular-nums font-medium">{formatCurrencyExact(row.total)}</td>
                  <td className={cn("px-3 py-2.5 font-mono tabular-nums font-medium", row.balance > 0 ? "text-amber-400" : "text-emerald-400")}>
                    {row.balance > 0 ? formatCurrencyExact(row.balance) : "--"}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10"><CheckCircle2 className="w-2.5 h-2.5" /> Paid</span>
                    ) : od ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-red-400 bg-red-500/10"><AlertTriangle className="w-2.5 h-2.5" /> Overdue</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-400 bg-amber-500/10"><Clock className="w-2.5 h-2.5" /> Open</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default InvoicesView;
