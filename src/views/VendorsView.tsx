/**
 * VendorsView — Unified Monday + QuickBooks vendors
 *
 * Shows real QB bill data (AP, payment history, risk)
 * merged with Monday deal data (pipeline, stages, brands).
 * Vendor = SUPPLIER (Tevah buys FROM them, QB bills come FROM them).
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, AlertTriangle, TrendingUp, Truck, Package, Receipt } from "lucide-react";
import { cn, formatCurrency, formatCurrencyExact } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";
import { useUnifiedData } from "../lib/use-unified";

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

export default function VendorsView() {
  const { data, loading } = useUnifiedData();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    data.vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase())),
    [data.vendors, search]
  );

  const selected = data.vendors.find(v => v.name === selectedName) ?? null;

  // Find QB bills for selected vendor
  const selectedBills = useMemo(() => {
    if (!selected || !data.qbLoaded) return [];
    const names = [selected.name, ...(selected.qbNames || [])].map(n => n.toLowerCase());
    return data.bills
      .filter(bill => names.some(n => bill.vendor.toLowerCase().includes(n) || n.includes(bill.vendor.toLowerCase())))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selected, data]);

  const totalSourced = data.vendors.reduce((s, v) => s + (v.qb?.totalBilled ?? v.mondayBuyTotal), 0);

  return (
    <div className="h-full flex">
      {/* List Panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-sidebar">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Vendors</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {data.vendors.length} vendors — {formatCurrency(totalSourced)} total sourced
              {data.qbLoaded && <span className="ml-1 text-emerald-600">(QB matched)</span>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..."
              className="h-8 pl-8 pr-3 w-48 text-xs bg-white border border-divider rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-purple-200 shadow-[var(--shadow-sm)]" />
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((vendor, i) => {
            const sourced = vendor.qb?.totalBilled ?? vendor.mondayBuyTotal;
            const unpaid = vendor.qb?.totalUnpaid ?? 0;
            const billCount = vendor.qb?.billCount ?? 0;
            const isSelected = selectedName === vendor.name;

            // Count Monday-specific stats
            const problemCount = vendor.deals.filter(d => d.stage === "Problem").length;
            const inTransitCount = vendor.deals.filter(d => d.stage === "Logistics").length;

            return (
              <motion.button
                key={vendor.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6) }}
                onClick={() => setSelectedName(isSelected ? null : vendor.name)}
                className={cn(
                  "w-full text-left p-4 rounded-[10px] transition-all bg-white",
                  isSelected
                    ? "ring-1 ring-purple-200 shadow-[var(--shadow-md)]"
                    : "hover:shadow-[var(--shadow-sm)] hover:bg-hover"
                )}
              >
                {/* Source badges */}
                <div className="flex items-center gap-1 mb-2">
                  {vendor.mondayName && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-600">Monday</span>}
                  {vendor.qbNames.length > 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-50 text-emerald-600">QB</span>}
                  {vendor.qbNames.length === 0 && vendor.mondayName && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-50 text-amber-600">No QB match</span>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", riskBg(vendor.risk))}>
                      <span className={cn("text-[10px] font-bold uppercase", riskColor(vendor.risk))}>{vendor.risk === "clean" ? "OK" : vendor.risk.slice(0, 4)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{vendor.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-text-tertiary">
                          {vendor.dealCount} deals
                          {billCount > 0 && ` · ${billCount} bills`}
                          {vendor.brands.length > 0 && ` · ${vendor.brands.slice(0, 3).join(", ")}`}
                        </p>
                        {problemCount > 0 && (
                          <span className="text-[9px] text-red-500 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />{problemCount}
                          </span>
                        )}
                        {inTransitCount > 0 && (
                          <span className="text-[9px] text-purple-600 flex items-center gap-0.5">
                            <Truck className="w-2.5 h-2.5" />{inTransitCount} in transit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(sourced)}</p>
                    {unpaid > 0 && <p className="text-[10px] text-amber-600 tabular-nums">{formatCurrency(unpaid)} unpaid</p>}
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
                  {selected.qb && ` · ${selected.qb.billCount} bills`}
                </p>
                {selected.qbNames.length > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">QB: {selected.qbNames.join(", ")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Card variant="elevated" className="p-2.5">
                <span className="text-[9px] text-text-tertiary uppercase">
                  {selected.qb ? "Total Billed" : "Monday Buy Total"}
                </span>
                <p className="text-sm font-bold text-text-primary tabular-nums">
                  {formatCurrency(selected.qb?.totalBilled ?? selected.mondayBuyTotal)}
                </p>
              </Card>
              <Card variant="elevated" className="p-2.5">
                <span className="text-[9px] text-text-tertiary uppercase">
                  {selected.qb ? "Unpaid Balance" : "Avg Order"}
                </span>
                <p className={cn("text-sm font-bold tabular-nums",
                  selected.qb ? (selected.qb.totalUnpaid > 0 ? "text-amber-600" : "text-emerald-600") : "text-text-primary"
                )}>
                  {selected.qb
                    ? formatCurrency(selected.qb.totalUnpaid)
                    : formatCurrency(selected.dealCount > 0 ? selected.mondayBuyTotal / selected.dealCount : 0)
                  }
                </p>
              </Card>
            </div>

            {/* Status Overview */}
            {selected.deals.length > 0 && (() => {
              const inTransit = selected.deals.filter(d => d.stage === "Logistics" || d.delivery === "Booked" || d.delivery === "Enroute to 3PL" || d.delivery === "Enroute to CST");
              const problems = selected.deals.filter(d => d.stage === "Problem");
              const confirmed = selected.deals.filter(d => d.stage === "Confirmed");
              const pending = selected.deals.filter(d => d.stage === "Need Confirmation");

              return (
                <div>
                  <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Status Overview</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {inTransit.length > 0 && (
                      <div className="p-2 rounded-lg bg-purple-50 border-l-2 border-l-purple-400">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3 h-3 text-purple-600" />
                          <span className="text-[10px] text-purple-700 font-medium">{inTransit.length} In Transit</span>
                        </div>
                      </div>
                    )}
                    {pending.length > 0 && (
                      <div className="p-2 rounded-lg bg-amber-50 border-l-2 border-l-amber-400">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3 h-3 text-amber-600" />
                          <span className="text-[10px] text-amber-700 font-medium">{pending.length} Pending</span>
                        </div>
                      </div>
                    )}
                    {confirmed.length > 0 && (
                      <div className="p-2 rounded-lg bg-emerald-50 border-l-2 border-l-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] text-emerald-700 font-medium">{confirmed.length} Confirmed</span>
                        </div>
                      </div>
                    )}
                    {problems.length > 0 && (
                      <div className="p-2 rounded-lg bg-red-50 border-l-2 border-l-red-400">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] text-red-600 font-medium">{problems.length} Problems</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Brand Catalog */}
            {selected.brands.length > 0 && (
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Brands ({selected.brands.length})</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selected.brands.slice(0, 20).map(brand => (
                    <span key={brand} className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-text-secondary border border-divider">{brand}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Watchtower */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3 h-3 text-advisor-watchtower" />
                <span className="text-[10px] text-advisor-watchtower uppercase tracking-wider font-semibold">Watchtower</span>
              </div>
              <Card variant="elevated" className="p-2.5 border-l-2 border-l-advisor-watchtower">
                {selected.deals.filter(d => d.stage === "Problem").length > 2 ? (
                  <p className="text-[11px] text-red-600">Reliability declining. {selected.deals.filter(d => d.stage === "Problem").length} problem orders. Consider backup vendor.</p>
                ) : selected.deals.filter(d => d.stage === "Logistics").length > 3 ? (
                  <p className="text-[11px] text-amber-700">High volume in transit ({selected.deals.filter(d => d.stage === "Logistics").length} orders). Monitor delivery performance.</p>
                ) : selected.dealCount === 0 && selected.qb ? (
                  <p className="text-[11px] text-text-secondary">QB-only vendor — no Monday deals. Historical supplier or direct billing.</p>
                ) : (
                  <p className="text-[11px] text-emerald-700">Vendor performing within normal parameters. Delivery cadence stable.</p>
                )}
              </Card>
            </div>

            {/* QB Bills */}
            {selectedBills.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Receipt className="w-3 h-3 text-purple-600" />
                  <span className="text-[10px] text-purple-600 uppercase tracking-wider font-semibold">QB Bills ({selectedBills.length})</span>
                </div>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {selectedBills.map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-2 rounded-md hover:bg-hover transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-text-secondary flex-none">#{bill.docNumber || "--"}</span>
                        <span className="text-[10px] text-text-tertiary">{bill.date}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                          bill.status === "paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>{bill.status}</span>
                        <span className="text-[10px] font-mono text-text-primary tabular-nums">{formatCurrencyExact(bill.total)}</span>
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
                  {selected.deals.sort((a, b) => b.buyTotal - a.buyTotal).slice(0, 30).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between p-2 rounded-md hover:bg-hover transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-text-secondary flex-none">#{deal.dealNumber}</span>
                        <span className="text-[10px] text-text-tertiary truncate">{deal.brand} → {deal.customer}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <StagePill stage={deal.stage} />
                        {deal.buyTotal > 0 && <span className="text-[10px] font-mono text-text-secondary tabular-nums">{formatCurrency(deal.buyTotal)}</span>}
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
