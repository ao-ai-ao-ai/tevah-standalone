/**
 * OrderDetailView — Standalone 3-panel order detail page
 * Receives dealId, looks up from ALL_DEALS, shows full cascade + comms.
 */

import { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft, Calendar, Clock, CreditCard, Truck, Mail,
  MessageSquare, Package, Check, AlertTriangle, Send,
} from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { StagePill } from "../components/stage-pill";
import { CascadeFull, CascadeTimeline, DealLifecycle, buildDealTimeline, getLockState } from "../components/cascade";
import { AdvisorStack, type AdvisorInsight } from "../components/advisor-card";
import { DataTable, type Column } from "../components/data-table";
import { ALL_DEALS } from "../data/monday";
import { DEALS_BY_NUMBER } from "../data/deal-intelligence";

interface OrderDetailViewProps {
  dealId: string;
  onBack: () => void;
}

interface LineItem {
  id: string;
  sku: string;
  qty: number;
  vendorCost: number;
  ourPrice: number;
  customerAsk: number;
  marginPct: number;
}

interface CommEntry {
  date: string;
  actor: string;
  message: string;
  type: "email" | "note" | "system" | "action";
}

// Build line items from real deal intelligence data, fallback to seeded RNG
function seed(s: string): () => number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return () => { h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 13), 0x45d9f3b); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

function buildLineItems(dealId: string, buyTotal: number, sellTotal: number, brand: string, dealNumber: string): LineItem[] {
  const intel = DEALS_BY_NUMBER[dealNumber];
  if (intel?.items && intel.items.length > 0) {
    return intel.items.map((item, i) => ({
      id: `${dealId}-li-${i}`,
      sku: item.sku || item.product.substring(0, 20),
      qty: item.qty,
      vendorCost: item.vendorCost,
      ourPrice: item.ourPrice,
      customerAsk: item.customerPrice ?? item.ourPrice,
      marginPct: Math.round(item.margin * 10) / 10,
    }));
  }
  // Fallback: seeded RNG for deals without real item data
  const rng = seed(dealId);
  const n = 2 + Math.floor(rng() * 3);
  const items: LineItem[] = [];
  let remBuy = buyTotal || 1000;
  let remSell = sellTotal || 1200;

  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    const frac = last ? 1 : 0.2 + rng() * 0.4;
    const vc = last ? remBuy : Math.round(remBuy * frac);
    const ca = last ? remSell : Math.round(remSell * frac);
    const op = Math.round(vc + (ca - vc) * (0.3 + rng() * 0.4));
    const qty = 10 + Math.floor(rng() * 490);
    const margin = ca > 0 ? ((ca - vc) / ca) * 100 : 0;
    items.push({
      id: `${dealId}-li-${i}`,
      sku: `${brand.substring(0, 3).toUpperCase()}-${1000 + Math.floor(rng() * 9000)}`,
      qty, vendorCost: vc, ourPrice: op, customerAsk: ca,
      marginPct: Math.round(margin * 10) / 10,
    });
    remBuy -= vc;
    remSell -= ca;
  }
  return items;
}

function buildCascadeEventsFromDeal(deal: typeof ALL_DEALS[0]) {
  const intel = DEALS_BY_NUMBER[deal.dealNumber];
  return buildDealTimeline(deal, intel);
}

function buildAdvisors(margin: number, spread: number, payment: string | null): AdvisorInsight[] {
  return [
    { advisor: "shark", headline: margin >= 15 ? "Strong margin — hold the line" : margin >= 8 ? "Acceptable margin, room to push" : "Thin margin — renegotiate vendor cost", confidence: margin >= 15 ? 0.9 : 0.6, sentiment: margin >= 15 ? "positive" : margin >= 8 ? "neutral" : "warning" },
    { advisor: "negotiator", headline: spread > 5000 ? "Solid spread for counter-leverage" : "Low spread limits negotiation room", confidence: 0.75, sentiment: spread > 5000 ? "positive" : "neutral" },
    { advisor: "savant", headline: "Market pricing stable for this brand segment", confidence: 0.7, sentiment: "neutral" },
    { advisor: "comptroller", headline: payment === "Overdue" ? "Payment overdue — escalate before shipping" : payment === "Received" ? "Fully collected — clear to proceed" : "Payment pending — monitor closely", confidence: 0.85, sentiment: payment === "Overdue" ? "negative" : payment === "Received" ? "positive" : "neutral" },
    { advisor: "watchtower", headline: "No SLA breaches detected. Delivery timeline nominal.", confidence: 0.8, sentiment: "positive" },
  ];
}

function buildComms(deal: typeof ALL_DEALS[0]): CommEntry[] {
  const intel = DEALS_BY_NUMBER[deal.dealNumber];
  if (intel?.documents && intel.documents.length > 0) {
    return intel.documents.map((doc) => ({
      date: doc.date || "N/A",
      actor: doc.from || "Tevah",
      message: doc.subject || doc.filename || "Document",
      type: "email" as const,
    }));
  }
  // Fallback: fabricated comms for deals without real documents
  return [
    { date: "Mar 2", actor: deal.vendor, type: "email", message: `Final pricing confirmed. PO ready for ${formatCurrency(deal.buyTotal)}.` },
    { date: "Mar 1", actor: "Tevah", type: "system", message: `Offer #${deal.dealNumber} sent to ${deal.customer || "customer"} at ${formatCurrency(deal.sellTotal)}` },
    { date: "Feb 28", actor: deal.customer || "Customer", type: "email", message: `Requesting updated specs and pricing for ${deal.brand} order.` },
    { date: "Feb 27", actor: deal.vendor, type: "email", message: "Revised quote attached. Lead time 3-4 weeks. MOQ 200 units." },
    { date: "Feb 25", actor: "Tevah", type: "action", message: "RFQ created and sent to vendor" },
    { date: "Feb 24", actor: deal.customer || "Customer", type: "email", message: `Initial inquiry for ${deal.brand}. Budget range ${formatCurrency(deal.sellTotal * 0.9)} - ${formatCurrency(deal.sellTotal * 1.1)}.` },
  ];
}

const LINE_COLS: Column<LineItem>[] = [
  { key: "sku", label: "SKU", width: "100px", sortable: true },
  { key: "qty", label: "Qty", width: "60px", align: "right", render: (r) => r.qty.toLocaleString() },
  { key: "vendorCost", label: "Vendor", width: "90px", align: "right", render: (r) => formatCurrency(r.vendorCost) },
  { key: "ourPrice", label: "Ours", width: "90px", align: "right", render: (r) => formatCurrency(r.ourPrice) },
  { key: "customerAsk", label: "Ask", width: "90px", align: "right", render: (r) => formatCurrency(r.customerAsk) },
  {
    key: "marginPct", label: "Margin", width: "70px", align: "right", sortable: true,
    render: (r) => <span className={cn("tabular-nums font-medium", r.marginPct >= 15 ? "text-emerald-600" : r.marginPct >= 8 ? "text-blue-500" : "text-amber-600")}>{r.marginPct}%</span>,
  },
];

const COMM_ICONS = { email: Mail, note: MessageSquare, system: Package, action: Send };

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-[var(--shadow-lg)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onAnimationComplete={() => setTimeout(onDone, 2000)}
    >
      <Check className="w-4 h-4" />
      {message}
    </motion.div>
  );
}

export function OrderDetailView({ dealId, onBack }: OrderDetailViewProps) {
  const [toast, setToast] = useState<string | null>(null);

  const deal = ALL_DEALS.find(d => d.id === dealId);
  if (!deal) {
    return (
      <div className="flex items-center justify-center h-full bg-canvas">
        <Card variant="elevated" className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-text-secondary">Deal not found</p>
          <button onClick={onBack} className="mt-3 text-sm text-purple-600 hover:text-purple-500">Go back</button>
        </Card>
      </div>
    );
  }

  const lineItems = useMemo(() => buildLineItems(deal.id, deal.buyTotal, deal.sellTotal, deal.brand, deal.dealNumber), [deal]);
  const cascadeEvents = useMemo(() => buildCascadeEventsFromDeal(deal), [deal]);
  const lockState = useMemo(() => getLockState(deal.stage), [deal.stage]);
  const currentPhase = useMemo(() => {
    const s = deal.stage.toLowerCase();
    if (s.includes("won") || s.includes("lost")) return "closed" as const;
    if (s.includes("deliver") || s.includes("ship") || s.includes("warehouse")) return "fulfillment" as const;
    if (s.includes("payment") || s.includes("invoice")) return "payment" as const;
    if (s.includes("confirm") || s.includes("order")) return "order" as const;
    if (s.includes("offer") || s.includes("review")) return "negotiation" as const;
    return "inquiry" as const;
  }, [deal.stage]);
  const advisors = useMemo(() => buildAdvisors(deal.margin, deal.spread, deal.payment), [deal]);
  const comms = useMemo(() => buildComms(deal), [deal]);
  const cascade = useMemo(() => ({ vendorCost: deal.buyTotal, ourPrice: Math.round(deal.buyTotal * 1.06), customerAsk: deal.sellTotal }), [deal]);

  const handleAction = useCallback((label: string) => {
    setToast(label);
  }, []);

  const actions = [
    { key: "approve", label: "Approve Order", icon: Check, style: "bg-purple-600 hover:bg-purple-500 text-white shadow-[var(--shadow-sm)]" },
    { key: "send", label: "Send to Vendor", icon: Send, style: "bg-white hover:bg-hover text-text-primary border border-divider" },
    { key: "email", label: "Email Customer", icon: Mail, style: "bg-white hover:bg-hover text-text-primary border border-divider" },
    { key: "hold", label: "Put on Hold", icon: Clock, style: "bg-transparent hover:bg-hover text-text-secondary border border-divider" },
  ];

  return (
    <motion.div
      className="flex flex-col h-full bg-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-divider shrink-0 bg-white">
        <button onClick={onBack} className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Orders
        </button>
        <div className="w-px h-5 bg-divider" />
        <span className="text-text-primary font-semibold">#{deal.dealNumber}</span>
        <span className="text-text-tertiary">·</span>
        <span className="text-text-secondary">{deal.brand}</span>
        <span className="text-text-tertiary">·</span>
        <StagePill stage={deal.stage} size="sm" />
        <div className="flex-1" />
        <span className="text-xs text-text-tertiary tabular-nums">{formatCurrency(deal.sellTotal)} sell · {formatCurrency(deal.spread)} spread</span>
      </div>

      {/* 3-Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Properties Sidebar */}
        <div className="w-[220px] shrink-0 border-r border-divider p-4 overflow-y-auto flex flex-col gap-4 bg-sidebar">
          {/* Ambient AI one-liner */}
          <p className="text-text-tertiary text-[11px] italic leading-tight">Pricing trajectory converging — deal health nominal</p>

          <Card variant="elevated" className="p-3 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Customer</p>
              <p className="text-sm font-medium text-customer truncate">{deal.customer || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Vendor</p>
              <p className="text-sm font-medium text-vendor truncate">{deal.vendor}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Brand</p>
              <p className="text-sm font-medium text-text-secondary">{deal.brand}</p>
            </div>
          </Card>

          <Card variant="elevated" className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Calendar className="w-3.5 h-3.5" />
              <span>{deal.date || "No date"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Truck className="w-3.5 h-3.5" />
              <span>{deal.delivery || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CreditCard className="w-3.5 h-3.5 text-text-secondary" />
              <span className={cn(
                deal.payment === "Overdue" ? "text-red-500" : deal.payment === "Received" ? "text-emerald-600" : "text-text-secondary",
              )}>
                {deal.payment || "N/A"}
              </span>
            </div>
          </Card>

          <Card variant="elevated" className="p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Sell</span>
              <span className="text-customer tabular-nums font-medium border-r-2 border-r-advisor-comptroller pr-2">{formatCurrency(deal.sellTotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Buy</span>
              <span className="text-vendor tabular-nums font-medium">{formatCurrency(deal.buyTotal)}</span>
            </div>
            <div className="h-px bg-divider my-1" />
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">Spread</span>
              <span className="text-tevah tabular-nums font-semibold">{formatCurrency(deal.spread)}</span>
            </div>
            <div className="flex justify-between text-xs border-l-2 border-l-advisor-shark pl-2">
              <span className="text-text-tertiary">Margin</span>
              <span className={cn("tabular-nums font-semibold", deal.margin >= 15 ? "text-emerald-600" : deal.margin >= 8 ? "text-blue-500" : "text-amber-600")}>
                {deal.margin}%
              </span>
            </div>
          </Card>

          <div className="flex flex-col gap-1.5 mt-auto">
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={() => handleAction(a.label)}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", a.style)}
              >
                <a.icon className="w-3.5 h-3.5" />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center — Line Items + Comms */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-white">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
              Line Items <span className="text-text-tertiary ml-1">{lineItems.length}</span>
            </h3>
            <DataTable<LineItem> columns={LINE_COLS} data={lineItems} keyField="id" compact />
          </div>

          {/* Communication History */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Communication History</h3>
            <Card variant="elevated" className="p-3">
              <div className="space-y-3">
                {comms.map((c, i) => {
                  const Icon = COMM_ICONS[c.type];
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="relative mt-0.5">
                        <Icon className={cn(
                          "w-3.5 h-3.5",
                          c.type === "email" ? "text-blue-500" : c.type === "system" ? "text-text-tertiary" : c.type === "action" ? "text-purple-600" : "text-purple-500",
                        )} />
                        {i < comms.length - 1 && <div className="absolute left-1.5 top-4 w-px h-4 bg-divider" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-text-primary truncate">{c.actor}</span>
                          <span className="text-[10px] text-text-tertiary tabular-nums">{c.date}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Right — Intelligence Panel */}
        <div className="w-[300px] shrink-0 border-l border-divider p-4 overflow-y-auto flex flex-col gap-4 bg-canvas">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Intelligence</h3>
          <CascadeFull data={cascade} lockState={lockState} />
          <DealLifecycle currentPhase={currentPhase} events={cascadeEvents} />
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Deal Timeline</h4>
            <CascadeTimeline events={cascadeEvents} grouped />
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">Advisors</h4>
            <AdvisorStack insights={advisors} />
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </motion.div>
  );
}
