/**
 * TEVAH — Built for the Three-Party Deal
 * ========================================
 * Standalone showcase. Zero Hercules. Pure Tevah.
 *
 * This is the email-centric wholesale order management system.
 * Four-panel layout: Nav | Email List | Thread View | Intelligence Panel
 * Every pixel designed to make Turian AI look like child's play.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, MailOpen, Archive, Clock, Search, Tag, Star, Send,
  ShoppingCart, Package, Truck, CreditCard, Inbox, Home,
  ChevronRight, ChevronDown, Paperclip, Reply, Forward,
  AlertTriangle, CheckCircle2, Brain, Sparkles, ArrowRight,
  ExternalLink, User, Building2, TrendingUp, TrendingDown,
  Minus, DollarSign, FileText, X, Check, AlertCircle, Zap,
  Eye, EyeOff, Keyboard, BarChart3, Users, Settings, Bell,
  PanelRightClose, PanelRightOpen, ChevronUp, Layers,
  LayoutDashboard, Receipt, Boxes, Globe, Activity,
} from "lucide-react";

// ============================================================================
// TYPES & DATA (Real Tevah patterns, not generic mock)
// ============================================================================

type SplitTab = "all" | "orders" | "quotes" | "suppliers" | "shipping" | "payments";
type NavSection = "inbox" | "pipeline" | "orders" | "customers" | "vendors" | "dashboard";
type ThreeWayScenario = "MATCH" | "PREMIUM" | "DISCOUNT_OK" | "DISCOUNT_BELOW" | "LOSS";

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  company: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  timeAgo: string;
  isUnread: boolean;
  category: SplitTab;
  urgency: "urgent" | "high" | "medium" | "low";
  aiCategory: string;
  aiSummary: string;
  attachments: string[];
  threadCount: number;
  hasOrder: boolean;
  extraction?: {
    items: Array<{ product: string; qty: number; price: number; status: string }>;
    total: number;
    shipBy: string;
    confidence: number;
  };
  threeWay?: {
    vendorCost: number;
    ourOffer: number;
    customerAsk: number;
    scenario: ThreeWayScenario;
    margin: number;
  };
  customer?: {
    name: string;
    tier: string;
    healthScore: number;
    avgOrder: number;
    frequency: string;
    openOrders: number;
    paymentTerms: string;
    lastContact: string;
    totalRevenue: number;
  };
}

// --- Real Tevah data patterns (from 426 Monday deals) ---
const EMAILS: Email[] = [
  {
    id: "1",
    from: "Sarah Chen",
    fromEmail: "sarah@nordstrom.com",
    company: "Nordstrom",
    subject: "RE: Spring 2026 Waterford Crystal — PO #NS-44821",
    preview: "Hi Gil, confirming order for 500 units of Waterford Lismore...",
    body: `Hi Gil,

Confirming our order for the Spring 2026 collection:

- 500x Waterford Lismore Essence White Wine — $45.00/ea
- 300x Waterford Lismore Diamond Tumbler — $38.00/ea
- 200x Waterford Marquis Moments Flute Set — $62.00/ea

Please confirm availability and ship by March 15.

Payment terms: Net 30 as usual.

Best,
Sarah Chen
Senior Buyer, Home & Kitchen
Nordstrom Inc.`,
    time: "2:34 PM",
    timeAgo: "12m",
    isUnread: true,
    category: "orders",
    urgency: "high",
    aiCategory: "Purchase Order",
    aiSummary: "PO from Nordstrom for 1,000 units of Waterford Crystal across 3 SKUs. Total value $46,300. Standard terms (Net 30). Ship by March 15.",
    attachments: ["PO-NS-44821.pdf"],
    threadCount: 4,
    hasOrder: false,
    extraction: {
      items: [
        { product: "Waterford Lismore Essence White Wine", qty: 500, price: 45.00, status: "In Stock" },
        { product: "Waterford Lismore Diamond Tumbler", qty: 300, price: 38.00, status: "In Stock" },
        { product: "Waterford Marquis Moments Flute Set", qty: 200, price: 62.00, status: "Low Stock" },
      ],
      total: 46300,
      shipBy: "March 15, 2026",
      confidence: 0.96,
    },
    threeWay: {
      vendorCost: 31410,
      ourOffer: 39200,
      customerAsk: 46300,
      scenario: "PREMIUM",
      margin: 15.3,
    },
    customer: {
      name: "Nordstrom",
      tier: "Gold",
      healthScore: 92,
      avgOrder: 38500,
      frequency: "3/mo",
      openOrders: 2,
      paymentTerms: "Net 30",
      lastContact: "Today",
      totalRevenue: 2847000,
    },
  },
  {
    id: "2",
    from: "Mike Rodriguez",
    fromEmail: "mike.r@costco.com",
    company: "Costco",
    subject: "Price check — Villeroy & Boch Dinner Sets",
    preview: "Gil, we're looking at doing a promotion on V&B sets for Q2...",
    body: `Gil,

We're looking at doing a promotion on Villeroy & Boch dinner sets for Q2. Can you give us pricing on:

- 2,000x NewWave 12pc Dinner Set
- 1,500x Artesano 16pc Set
- 800x Manufacture Rock 6pc Set

Need your best price — this could be recurring quarterly if margins work.

Mike Rodriguez
Category Manager - Tabletop
Costco Wholesale`,
    time: "1:15 PM",
    timeAgo: "1h",
    isUnread: true,
    category: "quotes",
    urgency: "high",
    aiCategory: "Quote Request",
    aiSummary: "Bulk pricing request from Costco for 4,300 Villeroy & Boch dinner sets. High-value recurring opportunity. Needs competitive pricing.",
    attachments: [],
    threadCount: 1,
    hasOrder: false,
    customer: {
      name: "Costco",
      tier: "Platinum",
      healthScore: 88,
      avgOrder: 125000,
      frequency: "1/mo",
      openOrders: 1,
      paymentTerms: "Net 15",
      lastContact: "3 days ago",
      totalRevenue: 4200000,
    },
  },
  {
    id: "3",
    from: "Elena Rossi",
    fromEmail: "elena@waterford.com",
    company: "Waterford (Vendor)",
    subject: "RE: VPO-2026-00147 — Shipment Confirmation",
    preview: "Confirmed. 800 units shipped via DHL Express, tracking...",
    body: `Dear Gil,

VPO-2026-00147 has been shipped:

Tracking: DHL Express 7489201847
Units: 800
ETA: March 5, 2026
Warehouse: Your Miami facility

Invoice WF-INV-2026-3847 attached ($24,800.00).

Best regards,
Elena Rossi
Export Coordinator
Waterford Crystal / Fiskars Group`,
    time: "11:42 AM",
    timeAgo: "3h",
    isUnread: false,
    category: "suppliers",
    urgency: "medium",
    aiCategory: "Shipping Confirmation",
    aiSummary: "Waterford confirmed shipment of 800 units. DHL tracking provided. ETA March 5. Invoice $24,800 attached.",
    attachments: ["WF-INV-2026-3847.pdf", "DHL-tracking.pdf"],
    threadCount: 7,
    hasOrder: true,
  },
  {
    id: "4",
    from: "David Park",
    fromEmail: "david@target.com",
    company: "Target",
    subject: "Complaint — Broken items in shipment #TGT-29841",
    preview: "Gil, we received shipment TGT-29841 and 15 units arrived...",
    body: `Gil,

We received shipment TGT-29841 yesterday and 15 units of the Waterford Lismore arrived damaged. See photos attached.

This is the second time in 3 months. We need:
1. Replacement units shipped by Friday
2. Credit memo for damaged goods ($675.00)
3. Review of your packaging process

This is affecting our reorder decision for Q3.

David Park
Buyer, Premium Home
Target Corporation`,
    time: "10:05 AM",
    timeAgo: "4h",
    isUnread: true,
    category: "orders",
    urgency: "urgent",
    aiCategory: "Complaint",
    aiSummary: "URGENT: Target reports 15 damaged Waterford units. Second complaint in 3 months. Requesting replacement + credit. Risk to Q3 reorders ($180K pipeline).",
    attachments: ["damage-photos.zip"],
    threadCount: 1,
    hasOrder: true,
    customer: {
      name: "Target",
      tier: "Gold",
      healthScore: 61,
      avgOrder: 22000,
      frequency: "2/mo",
      openOrders: 3,
      paymentTerms: "Net 45",
      lastContact: "Today",
      totalRevenue: 1890000,
    },
  },
  {
    id: "5",
    from: "Lisa Wang",
    fromEmail: "accounting@macys.com",
    company: "Macy's",
    subject: "Payment Confirmation — INV-2026-0891",
    preview: "Payment of $34,750.00 has been processed via wire...",
    body: `Dear Tevah Global,

This confirms payment of $34,750.00 for invoice INV-2026-0891.

Payment method: Wire transfer
Reference: MCY-PAY-20260301-4821
Date: March 1, 2026

Please confirm receipt.

Accounts Payable
Macy's Inc.`,
    time: "9:30 AM",
    timeAgo: "5h",
    isUnread: false,
    category: "payments",
    urgency: "low",
    aiCategory: "Payment Confirmation",
    aiSummary: "Macy's paid $34,750 for INV-2026-0891 via wire. Confirm receipt.",
    attachments: [],
    threadCount: 2,
    hasOrder: true,
  },
  {
    id: "6",
    from: "James Miller",
    fromEmail: "james@williams-sonoma.com",
    company: "Williams-Sonoma",
    subject: "New inquiry — Le Creuset Holiday Collection 2026",
    preview: "Hi Gil, I saw your Le Creuset offering. We'd like to explore...",
    body: `Hi Gil,

I saw your Le Creuset offering from last quarter. We'd like to explore the 2026 Holiday Collection for our stores.

Can you send us:
1. Available SKUs and MOQs
2. Wholesale pricing tiers
3. Lead times for holiday delivery (need by Sept 15)

We're looking at 50-80 stores potentially.

James Miller
VP Merchandising
Williams-Sonoma`,
    time: "Yesterday",
    timeAgo: "1d",
    isUnread: false,
    category: "quotes",
    urgency: "medium",
    aiCategory: "New Lead",
    aiSummary: "Williams-Sonoma interested in Le Creuset holiday collection for 50-80 stores. High-value prospect. Needs pricing and SKU availability.",
    attachments: [],
    threadCount: 1,
    hasOrder: false,
    customer: {
      name: "Williams-Sonoma",
      tier: "Prospect",
      healthScore: 0,
      avgOrder: 0,
      frequency: "New",
      openOrders: 0,
      paymentTerms: "TBD",
      lastContact: "Yesterday",
      totalRevenue: 0,
    },
  },
  {
    id: "7",
    from: "DHL Express",
    fromEmail: "noreply@dhl.com",
    company: "DHL",
    subject: "Shipment Update — 7489201832 — Customs Delay",
    preview: "Your shipment is held at customs. Updated ETA: March 8...",
    body: `Shipment 7489201832 Status Update:

Current status: Held at customs (Miami, FL)
Reason: Additional documentation required
Original ETA: March 3, 2026
Updated ETA: March 8, 2026

Action required: Submit commercial invoice and packing list.

DHL Express Tracking`,
    time: "Yesterday",
    timeAgo: "1d",
    isUnread: true,
    category: "shipping",
    urgency: "high",
    aiCategory: "Shipping Alert",
    aiSummary: "DHL customs delay on inbound shipment. 5-day delay. Needs commercial invoice + packing list submitted. Affects Target delivery timeline.",
    attachments: [],
    threadCount: 3,
    hasOrder: true,
  },
];

// ============================================================================
// SPLIT TAB CONFIG
// ============================================================================

const SPLIT_TABS: Array<{ id: SplitTab; label: string; icon: typeof Mail; color: string }> = [
  { id: "all", label: "All", icon: Inbox, color: "text-zinc-400" },
  { id: "orders", label: "Orders", icon: ShoppingCart, color: "text-blue-400" },
  { id: "quotes", label: "Quotes", icon: FileText, color: "text-violet-400" },
  { id: "suppliers", label: "Suppliers", icon: Package, color: "text-emerald-400" },
  { id: "shipping", label: "Shipping", icon: Truck, color: "text-amber-400" },
  { id: "payments", label: "Payments", icon: CreditCard, color: "text-green-400" },
];

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: typeof Mail; badge?: number }> = [
  { id: "inbox", label: "Inbox", icon: Mail, badge: 4 },
  { id: "pipeline", label: "Pipeline", icon: Layers },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "vendors", label: "Vendors", icon: Building2 },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
];

const URGENCY_DOT: Record<string, string> = {
  urgent: "bg-red-500 shadow-red-500/40 shadow-sm",
  high: "bg-amber-500",
  medium: "bg-zinc-600",
  low: "bg-zinc-700",
};

const SCENARIO_CONFIG: Record<ThreeWayScenario, { label: string; color: string; bg: string }> = {
  MATCH: { label: "Match", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  PREMIUM: { label: "Premium", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  DISCOUNT_OK: { label: "Discount OK", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  DISCOUNT_BELOW: { label: "Below Threshold", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  LOSS: { label: "Loss", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

// ============================================================================
// UTILITY
// ============================================================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ============================================================================
// APP
// ============================================================================

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>("inbox");
  const [activeTab, setActiveTab] = useState<SplitTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [showIntel, setShowIntel] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    activeTab === "all" ? EMAILS : EMAILS.filter(e => e.category === activeTab),
  [activeTab]);

  const selected = useMemo(() => EMAILS.find(e => e.id === selectedId), [selectedId]);
  const tabCounts = useMemo(() => {
    const c: Record<SplitTab, number> = { all: EMAILS.length, orders: 0, quotes: 0, suppliers: 0, shipping: 0, payments: 0 };
    EMAILS.forEach(e => { c[e.category]++; });
    return c;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const idx = filtered.findIndex(em => em.id === selectedId);
      switch (e.key) {
        case "j": e.preventDefault(); if (idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id); break;
        case "k": e.preventDefault(); if (idx > 0) setSelectedId(filtered[idx - 1].id); break;
        case "r": if (selectedId) { e.preventDefault(); setReplyOpen(true); } break;
        case "i": e.preventDefault(); setShowIntel(s => !s); break;
        case "/": e.preventDefault(); searchRef.current?.focus(); break;
        case "?": if (e.shiftKey) { e.preventDefault(); setShowShortcuts(s => !s); } break;
        case "Escape": setReplyOpen(false); setShowShortcuts(false); break;
        case "Tab": e.preventDefault();
          const tabs = SPLIT_TABS.map(t => t.id);
          const ti = tabs.indexOf(activeTab);
          setActiveTab(tabs[(ti + (e.shiftKey ? tabs.length - 1 : 1)) % tabs.length]);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, filtered, activeTab]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* ═══════════ NAV SIDEBAR ═══════════ */}
      <motion.nav
        animate={{ width: navCollapsed ? 56 : 200 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="flex-none flex flex-col border-r border-zinc-800/60 bg-zinc-950 overflow-hidden"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-800/60">
          <motion.div animate={{ width: navCollapsed ? 24 : "auto" }} className="overflow-hidden">
            {navCollapsed ? (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sage-500 to-lavender-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">T</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sage-500 to-lavender-500 flex items-center justify-center shadow-lg shadow-sage-500/20">
                  <span className="text-xs font-bold text-white">T</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-white tracking-tight">Tevah</span>
                  <span className="text-[9px] text-zinc-600 block -mt-0.5">Built for the deal</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg transition-all duration-100",
                navCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                activeNav === item.id
                  ? "bg-zinc-800/80 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              )}
              title={navCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-none" />
              {!navCollapsed && (
                <>
                  <span className="text-[13px] font-medium flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] tabular-nums bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {navCollapsed && item.badge && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>
          ))}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setNavCollapsed(c => !c)}
          className="h-10 flex items-center justify-center border-t border-zinc-800/60 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {navCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
        </button>
      </motion.nav>

      {/* ═══════════ LIST PANEL ═══════════ */}
      <div className="w-[340px] min-w-[280px] flex flex-col border-r border-zinc-800/60">
        {/* Split Tabs */}
        <div className="flex-none border-b border-zinc-800/60">
          <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto scrollbar-none">
            {SPLIT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-100",
                  activeTab === tab.id
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                )}
              >
                <tab.icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? tab.color : "")} />
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span className={cn("text-[10px] tabular-nums", activeTab === tab.id ? "text-zinc-300" : "text-zinc-600")}>
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                ref={searchRef}
                placeholder="Search emails... ( / )"
                className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.map(email => (
            <button
              key={email.id}
              onClick={() => { setSelectedId(email.id); setReplyOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-100 border-l-2 group",
                email.id === selectedId
                  ? "bg-violet-500/8 border-l-violet-500"
                  : cn(
                    "hover:bg-zinc-800/40 border-l-transparent",
                    email.urgency === "urgent" && "border-l-red-500/60 bg-red-500/3",
                    email.urgency === "high" && "border-l-amber-500/60"
                  ),
                email.isUnread && email.id !== selectedId && "bg-zinc-900/60"
              )}
            >
              <div className="flex items-start gap-2.5">
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-none mt-0.5",
                  email.id === selectedId ? "bg-violet-500/20 text-violet-300" : "bg-zinc-800 text-zinc-400"
                )}>
                  {email.from.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("text-xs truncate", email.isUnread ? "font-semibold text-white" : "font-medium text-zinc-300")}>
                      {email.company}
                    </span>
                    <span className="text-[10px] text-zinc-600 flex-none tabular-nums">{email.timeAgo}</span>
                  </div>
                  <p className={cn("text-xs truncate mb-0.5", email.isUnread ? "text-zinc-200" : "text-zinc-400")}>
                    {email.subject}
                  </p>
                  <p className="text-[11px] text-zinc-600 line-clamp-1">{email.preview}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-none", URGENCY_DOT[email.urgency])} />
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-500 font-medium">{email.aiCategory}</span>
                    {email.threadCount > 1 && <span className="text-[9px] text-zinc-600 tabular-nums">{email.threadCount}</span>}
                    {email.attachments.length > 0 && <Paperclip className="w-2.5 h-2.5 text-zinc-600" />}
                    {email.threeWay && (
                      <span className={cn("text-[9px] px-1 py-0.5 rounded border font-mono", SCENARIO_CONFIG[email.threeWay.scenario].bg, SCENARIO_CONFIG[email.threeWay.scenario].color)}>
                        {email.threeWay.margin.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-none px-3 py-2 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">{filtered.length} emails</span>
          <button onClick={() => setShowShortcuts(true)} className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors">
            <Keyboard className="w-3 h-3" /> Shift+?
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN THREAD VIEW ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Header */}
            <div className="flex-none px-5 py-3 border-b border-zinc-800/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">{selected.from} &lt;{selected.fromEmail}&gt;</span>
                    <span className="text-[10px] text-zinc-700">{selected.time}</span>
                    {selected.aiCategory && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Brain className="w-2.5 h-2.5" />{selected.aiCategory}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-none">
                  {[
                    { icon: Reply, label: "Reply (r)", action: () => setReplyOpen(true) },
                    { icon: Forward, label: "Forward (f)" },
                    { icon: Archive, label: "Archive (e)" },
                    { icon: Clock, label: "Snooze (h)" },
                    { icon: Tag, label: "Label (l)" },
                    { icon: Star, label: "Star (s)" },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} title={btn.label} className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors">
                      <btn.icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                  <div className="w-px h-4 bg-zinc-800 mx-1" />
                  <button onClick={() => setShowIntel(s => !s)} title="Toggle Intelligence (i)" className={cn("p-1.5 rounded-md transition-colors", showIntel ? "bg-violet-500/10 text-violet-400" : "text-zinc-600 hover:text-zinc-300")}>
                    {showIntel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Extraction Card */}
            {selected.extraction && (
              <div className="flex-none mx-5 mt-3">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-emerald-500/5 border border-zinc-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center">
                        <Brain className="w-3 h-3 text-violet-400" />
                      </div>
                      <span className="text-xs font-medium text-zinc-300">AI Extracted Data</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono tabular-nums">
                        {Math.round(selected.extraction.confidence * 100)}%
                      </span>
                      <button className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-zinc-800/50">Edit</button>
                      <button className="text-[10px] text-emerald-500 hover:text-emerald-400 px-1.5 py-0.5 rounded hover:bg-emerald-500/10"><Check className="w-3 h-3" /></button>
                    </div>
                  </div>

                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-zinc-600 border-b border-zinc-800/30">
                        <th className="text-left font-medium pb-1.5">Product</th>
                        <th className="text-right font-medium pb-1.5 w-16">Qty</th>
                        <th className="text-right font-medium pb-1.5 w-20">Unit Price</th>
                        <th className="text-right font-medium pb-1.5 w-24">Total</th>
                        <th className="text-right font-medium pb-1.5 w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.extraction.items.map((item, i) => (
                        <tr key={i} className="text-zinc-400 border-b border-zinc-800/20">
                          <td className="py-1.5">{item.product}</td>
                          <td className="text-right font-mono tabular-nums">{item.qty}</td>
                          <td className="text-right font-mono tabular-nums">${item.price.toFixed(2)}</td>
                          <td className="text-right font-mono tabular-nums text-zinc-300">{formatCurrency(item.qty * item.price)}</td>
                          <td className="text-right">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full",
                              item.status === "In Stock" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                            )}>{item.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/30">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                      <span>Ship by: <span className="text-zinc-400">{selected.extraction.shipBy}</span></span>
                      <span>Total: <span className="text-white font-semibold font-mono">{formatCurrency(selected.extraction.total)}</span></span>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20">
                      <ShoppingCart className="w-3 h-3" /> Create Order
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Three-Way Pricing */}
            {selected.threeWay && (
              <div className="flex-none mx-5 mt-2">
                <ThreeWayBar tw={selected.threeWay} />
              </div>
            )}

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="max-w-2xl">
                {/* AI Summary */}
                {selected.aiSummary && (
                  <div className="mb-4 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                      <span className="text-[10px] font-medium text-violet-400">AI Summary</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{selected.aiSummary}</p>
                  </div>
                )}

                {/* Body */}
                <div className="text-[13px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{selected.body}</div>

                {/* Attachments */}
                {selected.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors cursor-pointer">
                        <Paperclip className="w-3 h-3 text-zinc-500" />
                        <span className="text-[11px] text-zinc-400">{att}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reply */}
            <AnimatePresence>
              {replyOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="flex-none border-t border-zinc-800/60 overflow-hidden">
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-xs text-zinc-500">Reply to {selected.from}</span>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full min-h-[80px] px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-zinc-600">Cmd+Enter to send</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setReplyOpen(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 rounded-md hover:bg-zinc-800/50 transition-colors">Cancel</button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                          <Send className="w-3 h-3" /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/30 flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">Select an email</p>
            <p className="text-xs text-zinc-700 mt-1">j/k to navigate, Tab to switch splits</p>
          </div>
        )}
      </div>

      {/* ═══════════ INTELLIGENCE PANEL ═══════════ */}
      <AnimatePresence>
        {showIntel && selected && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-none border-l border-zinc-800/60 overflow-hidden"
          >
            <IntelPanel email={selected} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-72 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-white mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-2">
                {[["j / k","Navigate"],["r","Reply"],["e","Archive"],["h","Snooze"],["i","Toggle AI Panel"],["Tab","Next split"],["/ ","Search"],["?","This help"]].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{v}</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-300">{k}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// THREE-WAY PRICING BAR
// ============================================================================

function ThreeWayBar({ tw }: { tw: NonNullable<Email["threeWay"]> }) {
  const total = Math.max(tw.vendorCost, tw.ourOffer, tw.customerAsk);
  const sc = SCENARIO_CONFIG[tw.scenario];

  return (
    <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-medium text-zinc-400">3-Way Pricing</span>
        </div>
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", sc.bg, sc.color)}>{sc.label}</span>
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {[
          { label: "Vendor Cost", value: tw.vendorCost, color: "bg-blue-500" },
          { label: "Our Offer", value: tw.ourOffer, color: "bg-violet-500" },
          { label: "Customer Ask", value: tw.customerAsk, color: "bg-emerald-500" },
        ].map(bar => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600 w-20 flex-none">{bar.label}</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(bar.value / total) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className={cn("h-full rounded-full", bar.color)}
              />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono tabular-nums w-16 text-right">{formatCurrency(bar.value)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/30">
        <span className="text-[10px] text-zinc-600">Gross Margin</span>
        <span className={cn("text-xs font-semibold tabular-nums", tw.margin >= 10 ? "text-emerald-400" : tw.margin >= 5 ? "text-amber-400" : "text-red-400")}>
          {tw.margin.toFixed(1)}% ({formatCurrency(tw.customerAsk - tw.vendorCost)})
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// INTELLIGENCE PANEL
// ============================================================================

function IntelPanel({ email }: { email: Email }) {
  const [tab, setTab] = useState<"customer" | "orders" | "history">("customer");
  const cust = email.customer;

  const tabs = [
    { id: "customer" as const, label: "Customer" },
    { id: "orders" as const, label: "Orders" },
    { id: "history" as const, label: "Timeline" },
  ];

  return (
    <div className="w-[320px] flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex-none px-4 py-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-violet-500/10">
            <Building2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{email.company}</p>
            <p className="text-[10px] text-zinc-500">{email.fromEmail}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none flex border-b border-zinc-800/60">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex-1 py-2 text-[11px] font-medium transition-colors relative", tab === t.id ? "text-violet-400" : "text-zinc-600 hover:text-zinc-400")}>
            {t.label}
            {tab === t.id && <motion.div layoutId="intel-tab-indicator" className="absolute bottom-0 left-3 right-3 h-[2px] bg-violet-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "customer" && cust && (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Health Score</span>
                <span className={cn("text-lg font-bold tabular-nums", cust.healthScore >= 80 ? "text-emerald-400" : cust.healthScore >= 60 ? "text-amber-400" : "text-red-400")}>
                  {cust.healthScore}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cust.healthScore}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className={cn("h-full rounded-full", cust.healthScore >= 80 ? "bg-emerald-500" : cust.healthScore >= 60 ? "bg-amber-500" : "bg-red-500")}
                />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                  cust.tier === "Platinum" ? "bg-violet-500/10 text-violet-400" :
                  cust.tier === "Gold" ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"
                )}>{cust.tier}</span>
                <span className="text-[10px] text-zinc-600">Since 2023</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Avg Order", value: formatCurrency(cust.avgOrder), trend: "up" as const },
                { label: "Frequency", value: cust.frequency, trend: "neutral" as const },
                { label: "Payment", value: cust.paymentTerms },
                { label: "Open Orders", value: String(cust.openOrders) },
              ].map(m => (
                <div key={m.label} className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{m.label}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-sm font-semibold text-zinc-200 tabular-nums">{m.value}</span>
                    {m.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                    {m.trend === "neutral" && <Minus className="w-3 h-3 text-zinc-600" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue */}
            {cust.totalRevenue > 0 && (
              <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Lifetime Revenue</span>
                <p className="text-lg font-bold text-white tabular-nums mt-0.5">{formatCurrency(cust.totalRevenue)}</p>
              </div>
            )}

            <button className="w-full py-2 text-xs text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors flex items-center justify-center gap-1">
              View Full Profile <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {tab === "customer" && !cust && (
          <div className="text-center py-8">
            <User className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">No customer profile linked</p>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Recent Orders</span>
            {email.hasOrder ? (
              <>
                {[
                  { id: "TEV-2026-00421", date: "Mar 1", status: "Confirmed", amount: 46300 },
                  { id: "TEV-2026-00398", date: "Feb 22", status: "Shipped", amount: 28700 },
                  { id: "TEV-2026-00371", date: "Feb 8", status: "Delivered", amount: 34200 },
                ].map(order => (
                  <div key={order.id} className="p-2.5 rounded-lg hover:bg-zinc-800/30 transition-colors cursor-pointer border border-transparent hover:border-zinc-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 font-mono">{order.id}</span>
                      <span className="text-[10px] text-zinc-600">{order.date}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full",
                        order.status === "Confirmed" ? "bg-blue-500/10 text-blue-400" :
                        order.status === "Shipped" ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>{order.status}</span>
                      <span className="text-xs text-zinc-400 font-mono tabular-nums">{formatCurrency(order.amount)}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-6">
                <ShoppingCart className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">No orders yet</p>
                <button className="mt-2 text-[11px] text-violet-400 hover:text-violet-300">Create Order</button>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-0">
            {[
              { icon: Mail, label: "Email received", detail: email.from, time: email.timeAgo, type: "email" },
              { icon: Brain, label: `AI classified as ${email.aiCategory}`, time: email.timeAgo, type: "ai" },
              ...(email.extraction ? [{ icon: FileText, label: "Data extracted — 3 line items", time: email.timeAgo, type: "ai" as const }] : []),
              ...(email.hasOrder ? [
                { icon: ShoppingCart, label: "Order created", detail: "TEV-2026-00421", time: "10m", type: "order" as const },
                { icon: CheckCircle2, label: "Confirmed by vendor", time: "5m", type: "success" as const },
              ] : []),
            ].map((event, i, arr) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center z-10",
                    event.type === "ai" ? "bg-violet-500/10" :
                    event.type === "order" ? "bg-blue-500/10" :
                    event.type === "success" ? "bg-emerald-500/10" : "bg-zinc-800/50"
                  )}>
                    <event.icon className={cn("w-3 h-3",
                      event.type === "ai" ? "text-violet-400" :
                      event.type === "order" ? "text-blue-400" :
                      event.type === "success" ? "text-emerald-400" : "text-zinc-500"
                    )} />
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-zinc-800/40 my-1" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-zinc-400">{event.label}</p>
                  {event.detail && <p className="text-[10px] text-zinc-500">{event.detail}</p>}
                  <p className="text-[10px] text-zinc-700">{event.time} ago</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
