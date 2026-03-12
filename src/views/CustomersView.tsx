/**
 * CustomersView — Unified Monday + QuickBooks customers
 *
 * Shows real QB invoice data (AR, payment history, risk)
 * merged with Monday deal data (pipeline, stages).
 * Customer = BUYER (Tevah sells TO them, QB invoices go TO them).
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, AlertTriangle, TrendingDown, TrendingUp, Shield, Receipt } from "lucide-react";
import { cn, formatCurrency, formatCurrencyExact } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";
import { useUnifiedData } from "../lib/use-unified";
import type { UnifiedCustomer } from "../lib/entity-resolver";

function riskColor(risk: string): string {
  if (risk === "critical") return "text-red-600";
  if (risk === "high") return "text-amber-600";
  if (risk === "watch") return "text-yellow-600";
  return "text-emerald-600";
}

function riskBg(risk: string): string {
  if (risk === "critical") return "bg-red-50";
  if (risk === "high") return "bg-amber-50";
  if (risk === "watch") return "bg-yellow-50";
  return "bg-emerald-50";
}

export default function CustomersView() {
  const { data, loading } = useUnifiedData();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    data.customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())),
    [data.customers, search]
  );

  const selected = data.customers.find(c => c.name === selectedName) ?? null;

  // Find QB invoices for selected customer
  const selectedInvoices = useMemo(() => {
    if (!selected || !data.qbLoaded) return [];
    const names = [selected.name, ...(selected.qbNames || [])].map(n => n.toLowerCase());
    return data.invoices
      .filter(inv => names.some(n => inv.customer.toLowerCase().includes(n) || n.includes(inv.customer.toLowerCase())))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selected, data]);

  const totalRevenue = data.customers.reduce((s, c) => s + (c.qb?.totalInvoiced ?? c.mondaySellTotal), 0);

  return (
    <div className="h-full flex">
      {/* List Panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-sidebar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Customers</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {data.customers.length} customers — {formatCurrency(totalRevenue)} total revenue
              {data.qbLoaded && <span className="ml-1 text-emerald-600">(QB matched)</span>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
              className="h-8 pl-8 pr-3 w-48 text-xs bg-white border border-divider rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-purple-200 shadow-[var(--shadow-sm)]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((cust, i) => {
            const revenue = cust.qb?.totalInvoiced ?? cust.mondaySellTotal;
            const unpaid = cust.qb?.totalUnpaid ?? 0;
            const pctUnpaid = cust.qb?.pctUnpaid ?? 0;
            const invoiceCount = cust.qb?.invoiceCount ?? 0;
            const isSelected = selectedName === cust.name;

            return (
              <motion.button
                key={cust.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6) }}
                onClick={() => setSelectedName(isSelected ? null : cust.name)}
                className={cn(
                  "text-left p-4 rounded-[10px] transition-all bg-white",
                  isSelected
                    ? "ring-1 ring-purple-200 shadow-[var(--shadow-md)]"
                    : "hover:shadow-[var(--shadow-sm)] hover:bg-hover"
                )}
              >
                {/* Source badges */}
                <div className="flex items-center gap-1 mb-2">
                  {cust.mondayName && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">Monday</span>}
                  {cust.qbNames.length > 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600">QB</span>}
                  {cust.qbNames.length === 0 && cust.mondayName && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-50 text-amber-600">No QB match</span>}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", riskBg(cust.risk))}>
                    <span className={cn("text-[10px] font-bold uppercase", riskColor(cust.risk))}>{cust.risk === "clean" ? "OK" : cust.risk.slice(0, 4)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{cust.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-text-tertiary">{cust.dealCount} deals</p>
                      {invoiceCount > 0 && <p className="text-[10px] text-text-tertiary">· {invoiceCount} invoices</p>}
                      {unpaid > 5000 && (
                        <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />{formatCurrency(unpaid)} unpaid
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-text-tertiary">Revenue</span>
                    <p className="text-xs font-bold text-text-primary tabular-nums">{formatCurrency(revenue)}</p>
                  </div>
                  <div className="border-l-2 border-l-advisor-comptroller pl-2">
                    <span className="text-[9px] text-text-tertiary">{cust.qb ? "Unpaid" : "Spread"}</span>
                    <p className={cn("text-xs font-bold tabular-nums", unpaid > 0 ? "text-amber-600" : "text-emerald-600")}>
                      {cust.qb ? formatCurrency(unpaid) : formatCurrency(cust.mondaySellTotal - cust.mondayBuyTotal)}
                    </p>
                  </div>
                  <div className="border-l-2 border-l-advisor-shark pl-2">
                    <span className="text-[9px] text-text-tertiary">% Unpaid</span>
                    <p className={cn("text-xs font-bold tabular-nums",
                      pctUnpaid >= 50 ? "text-red-500" : pctUnpaid >= 30 ? "text-amber-600" : "text-emerald-600"
                    )}>{pctUnpaid > 0 ? `${pctUnpaid.toFixed(0)}%` : "0%"}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          className="flex-none w-[400px] border-l border-divider overflow-y-auto bg-white"
        >
          <div className="p-4 border-b border-divider">
            <div className="flex items-center gap-3">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", riskBg(selected.risk))}>
                <span className={cn("text-sm font-bold uppercase", riskColor(selected.risk))}>{selected.risk}</span>
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">{selected.name}</p>
                <p className="text-xs text-text-tertiary">
                  {selected.dealCount} deals
                  {selected.qb && ` · ${selected.qb.invoiceCount} invoices`}
                </p>
                {selected.qbNames.length > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">QB: {selected.qbNames.join(", ")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-2">
              <Card variant="elevated" className="p-2.5">
                <span className="text-[9px] text-text-tertiary uppercase">
                  {selected.qb ? "Total Invoiced" : "Monday Revenue"}
                </span>
                <p className="text-sm font-bold text-text-primary tabular-nums">
                  {formatCurrency(selected.qb?.totalInvoiced ?? selected.mondaySellTotal)}
                </p>
              </Card>
              <Card variant="elevated" className="p-2.5">
                <span className="text-[9px] text-text-tertiary uppercase">
                  {selected.qb ? "Unpaid Balance" : "Spread"}
                </span>
                <p className={cn("text-sm font-bold tabular-nums",
                  selected.qb ? (selected.qb.totalUnpaid > 0 ? "text-amber-600" : "text-emerald-600") : "text-emerald-600"
                )}>
                  {selected.qb ? formatCurrency(selected.qb.totalUnpaid) : formatCurrency(selected.mondaySellTotal - selected.mondayBuyTotal)}
                </p>
              </Card>
            </div>

            {/* QB Invoice Analysis (Comptroller) */}
            {selected.qb && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-advisor-comptroller" />
                  <span className="text-[10px] text-advisor-comptroller uppercase tracking-wider font-semibold">Comptroller — QB Analysis</span>
                </div>
                <div className="space-y-2">
                  {selected.qb.pctUnpaid >= 50 && (
                    <div className="p-2.5 rounded-lg bg-red-50 border-l-2 border-l-red-400">
                      <p className="text-[11px] text-red-600 font-medium">
                        {selected.qb.pctUnpaid.toFixed(0)}% unpaid — {formatCurrency(selected.qb.totalUnpaid)} outstanding
                      </p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">Payment collection risk: HIGH</p>
                    </div>
                  )}
                  {selected.qb.pctUnpaid > 0 && selected.qb.pctUnpaid < 50 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border-l-2 border-l-amber-400">
                      <p className="text-[11px] text-amber-700 font-medium">
                        {selected.qb.pctUnpaid.toFixed(0)}% unpaid — {formatCurrency(selected.qb.totalUnpaid)} outstanding
                      </p>
                    </div>
                  )}
                  {selected.qb.pctUnpaid === 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border-l-2 border-l-emerald-400">
                      <p className="text-[11px] text-emerald-700 font-medium">All invoices paid in full</p>
                    </div>
                  )}
                  <Card variant="elevated" className="p-2.5">
                    <p className="text-[10px] text-text-secondary">Last invoice: <span className="text-text-primary font-medium">{selected.qb.lastInvoiceDate}</span></p>
                    <p className="text-[10px] text-text-secondary mt-1">Invoice count: <span className="text-text-primary font-medium">{selected.qb.invoiceCount}</span></p>
                  </Card>
                </div>
              </div>
            )}

            {/* Watchtower */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3 h-3 text-advisor-watchtower" />
                <span className="text-[10px] text-advisor-watchtower uppercase tracking-wider font-semibold">Watchtower</span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-50 border-l-2 border-l-advisor-watchtower">
                {selected.dealCount > 10 ? (
                  <p className="text-[11px] text-cyan-700">High-value customer — {selected.dealCount} deals across {selected.brands.length} brands.</p>
                ) : selected.dealCount === 0 ? (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> QB-only customer — no Monday deals. Likely historical or direct.
                  </p>
                ) : (
                  <p className="text-[11px] text-text-secondary">{selected.dealCount} deals. {selected.brands.length} brands.</p>
                )}
              </div>
            </div>

            {/* Brands */}
            {selected.brands.length > 0 && (
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Brands ({selected.brands.length})</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selected.brands.slice(0, 15).map(b => (
                    <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-text-secondary border border-divider">{b}</span>
                  ))}
                </div>
              </div>
            )}

            {/* QB Invoices */}
            {selectedInvoices.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Receipt className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] text-blue-600 uppercase tracking-wider font-semibold">QB Invoices ({selectedInvoices.length})</span>
                </div>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {selectedInvoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded-md hover:bg-hover transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-text-secondary flex-none">#{inv.docNumber}</span>
                        <span className="text-[10px] text-text-tertiary">{inv.date}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                          inv.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>{inv.status}</span>
                        <span className="text-[10px] font-mono text-text-primary tabular-nums">{formatCurrencyExact(inv.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monday Deals */}
            {selected.deals.length > 0 && (
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Monday Deals ({selected.deals.length})</span>
                <div className="mt-2 space-y-1.5 max-h-[250px] overflow-y-auto">
                  {selected.deals.sort((a, b) => b.sellTotal - a.sellTotal).slice(0, 30).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between p-2 rounded-md hover:bg-hover transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-text-secondary flex-none">#{deal.dealNumber}</span>
                        <span className="text-[10px] text-text-tertiary truncate">{deal.brand}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <StagePill stage={deal.stage} />
                        {deal.sellTotal > 0 && <span className="text-[10px] font-mono text-text-secondary tabular-nums">{formatCurrency(deal.sellTotal)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
