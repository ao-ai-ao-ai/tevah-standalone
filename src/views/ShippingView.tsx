import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Truck, Package, MapPin, AlertTriangle, CheckCircle2, Clock, Anchor } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";

type ShipmentStatus = "pending" | "in_transit" | "at_customs" | "at_warehouse" | "delivered" | "issue";

interface Shipment {
  id: string;
  dealNumber: string;
  customer: string;
  vendor: string;
  brand: string;
  status: ShipmentStatus;
  sellTotal: number;
  buyTotal: number;
  stage: string;
  delivery: string;
  date: string;
}

function deriveShipments(): Shipment[] {
  const shippable = ALL_DEALS.filter(d =>
    ["Logistics", "Confirmed", "Invoiced", "Won", "won- need payment"].includes(d.stage) ||
    (d.delivery && d.delivery !== "Not Started")
  );

  return shippable.map(d => {
    const delivery = (d.delivery || "").toLowerCase();
    let status: ShipmentStatus = "pending";
    if (delivery.includes("delivered") || delivery.includes("received")) status = "delivered";
    else if (delivery.includes("customs") || delivery.includes("hold")) status = "at_customs";
    else if (delivery.includes("warehouse") || delivery.includes("staged")) status = "at_warehouse";
    else if (delivery.includes("transit") || delivery.includes("shipped") || delivery.includes("tracking")) status = "in_transit";
    else if (delivery.includes("issue") || delivery.includes("damage") || delivery.includes("short")) status = "issue";
    else if (["Logistics"].includes(d.stage)) status = "in_transit";
    else if (["Won", "Invoiced"].includes(d.stage)) status = "delivered";

    return {
      id: `ship-${d.id}`,
      dealNumber: d.dealNumber,
      customer: d.customer,
      vendor: d.vendor,
      brand: d.brand,
      status,
      sellTotal: d.sellTotal,
      buyTotal: d.buyTotal,
      stage: d.stage,
      delivery: d.delivery || "Unknown",
      date: d.date || "",
    };
  });
}

type Tab = "all" | "in_transit" | "at_customs" | "at_warehouse" | "delivered" | "issues";

export function ShippingView() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const shipments = useMemo(() => deriveShipments(), []);

  const filtered = useMemo(() => {
    let list = shipments;
    if (tab === "in_transit") list = list.filter(s => s.status === "in_transit");
    if (tab === "at_customs") list = list.filter(s => s.status === "at_customs");
    if (tab === "at_warehouse") list = list.filter(s => s.status === "at_warehouse");
    if (tab === "delivered") list = list.filter(s => s.status === "delivered");
    if (tab === "issues") list = list.filter(s => s.status === "issue");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.dealNumber.toLowerCase().includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.vendor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [shipments, tab, search]);

  const counts = useMemo(() => ({
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    atCustoms: shipments.filter(s => s.status === "at_customs").length,
    atWarehouse: shipments.filter(s => s.status === "at_warehouse").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
    issues: shipments.filter(s => s.status === "issue").length,
    inTransitValue: shipments.filter(s => s.status === "in_transit").reduce((s, d) => s + d.sellTotal, 0),
  }), [shipments]);

  const statusBadge = (s: ShipmentStatus) => {
    const config: Record<ShipmentStatus, { icon: typeof Truck; label: string; cls: string }> = {
      pending: { icon: Clock, label: "Pending", cls: "text-text-tertiary bg-canvas" },
      in_transit: { icon: Truck, label: "In Transit", cls: "text-blue-700 bg-blue-50" },
      at_customs: { icon: Anchor, label: "Customs", cls: "text-amber-700 bg-amber-50" },
      at_warehouse: { icon: Package, label: "Warehouse", cls: "text-purple-700 bg-purple-50" },
      delivered: { icon: CheckCircle2, label: "Delivered", cls: "text-emerald-700 bg-emerald-50" },
      issue: { icon: AlertTriangle, label: "Issue", cls: "text-red-700 bg-red-50" },
    };
    const c = config[s];
    return (
      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", c.cls)}>
        <c.icon className="w-2.5 h-2.5" />
        {c.label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Shipping & Logistics</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {counts.inTransit} in transit ({formatCurrency(counts.inTransitValue)}) &mdash; {counts.issues} issues
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipments..."
              className="h-8 pl-8 pr-3 w-56 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: "In Transit", value: counts.inTransit.toString(), icon: Truck, color: "text-blue-600", iconBg: "bg-blue-50" },
            { label: "At Customs", value: counts.atCustoms.toString(), icon: Anchor, color: "text-amber-600", iconBg: "bg-amber-50" },
            { label: "At Warehouse", value: counts.atWarehouse.toString(), icon: Package, color: "text-purple-600", iconBg: "bg-purple-50" },
            { label: "Delivered", value: counts.delivered.toString(), icon: CheckCircle2, color: "text-emerald-600", iconBg: "bg-emerald-50" },
            { label: "Issues", value: counts.issues.toString(), icon: AlertTriangle, color: "text-red-600", iconBg: "bg-red-50" },
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
            { key: "all" as Tab, label: "All", count: counts.total },
            { key: "in_transit" as Tab, label: "In Transit", count: counts.inTransit },
            { key: "at_customs" as Tab, label: "Customs", count: counts.atCustoms },
            { key: "at_warehouse" as Tab, label: "Warehouse", count: counts.atWarehouse },
            { key: "delivered" as Tab, label: "Delivered", count: counts.delivered },
            { key: "issues" as Tab, label: "Issues", count: counts.issues },
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
                {["Deal #", "Brand", "Customer", "Vendor", "Status", "Value", "Delivery", "Stage", "Date"].map(h => (
                  <th key={h} className="text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-text-tertiary text-sm">No shipments match your filters.</td></tr>
              )}
              {filtered.map((s, i) => (
                <motion.tr key={s.id}
                  initial={i < 40 ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.008, 0.3) }}
                  className="border-b border-divider hover:bg-hover cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 font-mono text-text-secondary">#{s.dealNumber}</td>
                  <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-[140px]">{s.brand}</td>
                  <td className="px-3 py-2.5 text-text-primary truncate max-w-[160px]">{s.customer}</td>
                  <td className="px-3 py-2.5 text-text-tertiary truncate max-w-[140px]">{s.vendor}</td>
                  <td className="px-3 py-2.5">{statusBadge(s.status)}</td>
                  <td className="px-3 py-2.5 font-mono text-text-primary tabular-nums">{formatCurrency(s.sellTotal)}</td>
                  <td className="px-3 py-2.5 text-text-secondary truncate max-w-[160px]">{s.delivery}</td>
                  <td className="px-3 py-2.5"><StagePill stage={s.stage} size="xs" /></td>
                  <td className="px-3 py-2.5 text-text-tertiary whitespace-nowrap">{s.date || "--"}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export default ShippingView;
