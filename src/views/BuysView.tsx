/**
 * BuysView — Buy management with table view, filters, and inline expansion
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Zap, ChevronDown, ChevronRight, Package } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { DataTable, type Column } from "../components/data-table";
import { ALL_BUYS, type Buy, type BuyStatus } from "../data/buys";

interface BuysViewProps {
  onNavigate: (section: string) => void;
}

type FilterTab = "all" | "vendor" | "brand" | "status";

const STATUS_STYLES: Record<BuyStatus, { text: string; bg: string }> = {
  draft: { text: "text-gray-600", bg: "bg-gray-100" },
  pending_approval: { text: "text-amber-700", bg: "bg-amber-50" },
  approved: { text: "text-blue-700", bg: "bg-blue-50" },
  sent: { text: "text-blue-700", bg: "bg-blue-50" },
  acknowledged: { text: "text-cyan-700", bg: "bg-cyan-50" },
  confirmed: { text: "text-purple-700", bg: "bg-purple-50" },
  partially_shipped: { text: "text-orange-700", bg: "bg-orange-50" },
  shipped: { text: "text-orange-700", bg: "bg-orange-50" },
  partially_received: { text: "text-emerald-700", bg: "bg-emerald-50" },
  received: { text: "text-emerald-700", bg: "bg-emerald-50" },
  partially_invoiced: { text: "text-green-700", bg: "bg-green-50" },
  closed: { text: "text-green-700", bg: "bg-green-50" },
};

const STATUS_LABELS: Record<BuyStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending",
  approved: "Approved",
  sent: "Sent",
  acknowledged: "Ack'd",
  confirmed: "Confirmed",
  partially_shipped: "Part. Shipped",
  shipped: "Shipped",
  partially_received: "Part. Received",
  received: "Received",
  partially_invoiced: "Part. Invoiced",
  closed: "Closed",
};

function StatusPill({ status }: { status: BuyStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", s.text, s.bg)}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function BuyDetail({ buy }: { buy: Buy }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-4 py-3 bg-canvas border-t border-divider">
        <p className="text-[11px] text-text-tertiary italic mb-3">Consolidating {buy.lineItems.length} line items across {buy.customers.length} customer allocation{buy.customers.length > 1 ? "s" : ""}</p>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Customers</p>
            <div className="flex flex-wrap gap-1">
              {buy.customers.map((c) => (
                <span key={c} className="text-xs bg-purple-50 text-text-secondary px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Deal Numbers</p>
            <p className="text-xs text-text-secondary tabular-nums">{buy.dealNumbers.map(d => `#${d}`).join(", ")}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary mb-1">Dates</p>
            <p className="text-xs text-text-secondary">Created: {buy.createdAt}</p>
            {buy.sentAt && <p className="text-xs text-text-secondary">Sent: {buy.sentAt}</p>}
            {buy.eta && <p className="text-xs text-text-secondary">ETA: {buy.eta}</p>}
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.06em] text-text-tertiary border-b border-divider">
              <th className="text-left py-1 px-2">SKU</th>
              <th className="text-left py-1 px-2">Product</th>
              <th className="text-right py-1 px-2">Qty</th>
              <th className="text-right py-1 px-2">Unit Cost</th>
              <th className="text-right py-1 px-2">Total</th>
              <th className="text-left py-1 px-2">Allocated To</th>
            </tr>
          </thead>
          <tbody>
            {buy.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-divider text-text-primary">
                <td className="py-1 px-2 font-mono tabular-nums">{li.sku}</td>
                <td className="py-1 px-2">{li.product}</td>
                <td className="py-1 px-2 text-right tabular-nums">{li.quantity}</td>
                <td className="py-1 px-2 text-right tabular-nums">${li.unitCost.toFixed(2)}</td>
                <td className="py-1 px-2 text-right tabular-nums font-medium">{formatCurrency(li.totalCost)}</td>
                <td className="py-1 px-2 text-text-secondary">{li.allocatedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export function BuysView({ onNavigate }: BuysViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState("buyNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "vendor", label: "By Vendor" },
    { key: "brand", label: "By Brand" },
    { key: "status", label: "By Status" },
  ];

  const sorted = useMemo(() => {
    const arr = [...ALL_BUYS];
    arr.sort((a, b) => {
      const av = a[sortKey as keyof Buy];
      const bv = b[sortKey as keyof Buy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [sortKey, sortDir]);

  const columns: Column<Buy>[] = [
    {
      key: "buyNumber",
      label: "Buy #",
      width: "120px",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-1.5">
          {expandedId === row.id ? <ChevronDown className="w-3 h-3 text-text-tertiary" /> : <ChevronRight className="w-3 h-3 text-text-tertiary" />}
          <span className="font-mono font-medium text-text-primary">{row.buyNumber}</span>
          {row.isPowerBuy && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[9px] font-bold">
              <Zap className="w-2.5 h-2.5" />
              POWER
            </span>
          )}
        </span>
      ),
    },
    { key: "vendor", label: "Vendor", sortable: true, render: (row) => <span className="text-text-primary truncate max-w-[160px] block">{row.vendor}</span> },
    { key: "brand", label: "Brand", sortable: true, render: (row) => <span className="text-text-secondary">{row.brand}</span> },
    { key: "lineItems", label: "Items", width: "60px", align: "center", render: (row) => <span className="text-text-secondary">{row.lineItems.length}</span> },
    { key: "totalCost", label: "Total", width: "100px", align: "right", sortable: true, render: (row) => <span className="text-vendor font-medium tabular-nums">{formatCurrency(row.totalCost)}</span> },
    { key: "status", label: "Status", width: "110px", sortable: true, render: (row) => <StatusPill status={row.status} /> },
    {
      key: "customers",
      label: "Customer(s)",
      render: (row) => (
        <span className="text-text-secondary text-xs truncate max-w-[160px] block">
          {row.customers.length > 1 ? `${row.customers[0]} +${row.customers.length - 1}` : row.customers[0] || "—"}
        </span>
      ),
    },
    { key: "eta", label: "ETA", width: "90px", render: (row) => <span className="text-text-tertiary tabular-nums text-xs">{row.eta || "—"}</span> },
  ];

  const totalValue = ALL_BUYS.reduce((s, b) => s + b.totalCost, 0);
  const powerCount = ALL_BUYS.filter(b => b.isPowerBuy).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-purple-600" />
          <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Buys</h1>
          <span className="text-xs text-text-tertiary tabular-nums">{ALL_BUYS.length} buys · {formatCurrency(totalValue)}</span>
          {powerCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-purple-600">
              <Zap className="w-3 h-3" />
              {powerCount} Power Buys
            </span>
          )}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-[var(--shadow-sm)]">
          <Plus className="w-3.5 h-3.5" />
          Create Buy
        </button>
      </div>

      {/* Ambient AI */}
      <div className="px-6 -mt-1 mb-2">
        <p className="text-[11px] text-text-tertiary italic">3 buys pending vendor acknowledgment — Power Buy consolidation saved $4.2k this month</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === t.key
                ? "bg-purple-50 text-purple-600"
                : "text-text-secondary hover:text-text-primary hover:bg-hover",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 px-6 pb-4 overflow-y-auto">
        <DataTable<Buy>
          columns={columns}
          data={sorted}
          keyField="id"
          selectedKey={expandedId || undefined}
          onSelect={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
          onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
          sortKey={sortKey}
          sortDir={sortDir}
          emptyMessage="No buys created yet"
        />

        {/* Expanded detail */}
        <AnimatePresence>
          {expandedId && (() => {
            const buy = ALL_BUYS.find(b => b.id === expandedId);
            return buy ? <BuyDetail buy={buy} /> : null;
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
