/**
 * TEVAH — Built for the Three-Party Deal
 * ========================================
 * Standalone showcase. Zero Hercules. Pure Tevah.
 * Real data from Monday.com (500 deals, $15.8M).
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Archive, Star, Search,
  ShoppingCart, Inbox,
  Paperclip, Reply, Forward,
  Brain, Sparkles,
  ExternalLink, User,
  DollarSign, FileText, Check,
  Keyboard, BarChart3, Users, Layers,
  PanelRightClose, PanelRightOpen, Package, Truck,
} from "lucide-react";
import { cn, formatCurrency, formatCurrencyExact } from "./lib/utils";
import { EMAILS, ORDERS, STAGE_PIPELINE, type Email, type SplitTab, type ThreeWayScenario } from "./data/emails";
import DashboardView from "./views/DashboardView";
import PipelineView from "./views/PipelineView";
import OrdersView from "./views/OrdersView";
import CustomersView from "./views/CustomersView";
import VendorsView from "./views/VendorsView";

// ============================================================================
// NAV SECTION TYPE
// ============================================================================

type NavSection = "inbox" | "pipeline" | "orders" | "customers" | "vendors" | "dashboard";

// ============================================================================
// SCENARIO BADGES
// ============================================================================

const SCENARIO_CONFIG: Record<ThreeWayScenario, { label: string; color: string; bg: string }> = {
  MATCH: { label: "Match", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  PREMIUM: { label: "Premium", color: "text-violet-400", bg: "bg-violet-500/10" },
  DISCOUNT_OK: { label: "Discount OK", color: "text-blue-400", bg: "bg-blue-500/10" },
  DISCOUNT_BELOW: { label: "Below Floor", color: "text-amber-400", bg: "bg-amber-500/10" },
  LOSS: { label: "Loss", color: "text-red-400", bg: "bg-red-500/10" },
};

// ============================================================================
// URGENCY CONFIG
// ============================================================================

const URGENCY: Record<string, { dot: string; border: string }> = {
  urgent: { dot: "bg-red-500", border: "border-l-red-500/60" },
  high: { dot: "bg-amber-500", border: "border-l-amber-500/40" },
  medium: { dot: "bg-blue-500", border: "border-l-blue-500/30" },
  low: { dot: "bg-zinc-600", border: "border-l-zinc-700/30" },
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>("inbox");
  const [activeTab, setActiveTab] = useState<SplitTab>("all");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [showIntelligence, setShowIntelligence] = useState(true);
  const [showKeys, setShowKeys] = useState(false);

  // Mutable email state
  const [emails, setEmails] = useState(EMAILS);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const addToast = (message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Actions
  const archiveEmail = (emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isArchived: true } : e));
    addToast("Email archived");
    if (selectedEmailId === emailId) {
      const visible = emails.filter(e => !e.isArchived && e.id !== emailId);
      setSelectedEmailId(visible[0]?.id || null);
    }
  };

  const toggleStar = (emailId: string) => {
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isStarred: !e.isStarred } : e));
  };

  const createOrder = (email: Email) => {
    addToast(`Order created from ${email.company} email`);
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, hasOrder: true } : e));
  };

  // Navigation from other views
  const navigateToEmail = (emailId: string) => {
    setActiveSection("inbox");
    setSelectedEmailId(emailId);
  };

  const navigateToOrder = (_orderId: string) => {
    setActiveSection("orders");
  };

  const navigateFromDashboard = (section: string, id?: string) => {
    setActiveSection(section as NavSection);
    if (section === "inbox" && id) setSelectedEmailId(id);
  };

  // Filtered emails
  const filteredEmails = useMemo(() => {
    return emails
      .filter(e => !e.isArchived)
      .filter(e => activeTab === "all" || e.category === activeTab)
      .filter(e => !searchQuery ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [emails, activeTab, searchQuery]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (activeSection !== "inbox") return;
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const idx = filteredEmails.findIndex(em => em.id === selectedEmailId);
        if (idx < filteredEmails.length - 1) setSelectedEmailId(filteredEmails[idx + 1].id);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = filteredEmails.findIndex(em => em.id === selectedEmailId);
        if (idx > 0) setSelectedEmailId(filteredEmails[idx - 1].id);
      }
      if (e.key === "e" && selectedEmailId) archiveEmail(selectedEmailId);
      if (e.key === "s" && selectedEmailId) toggleStar(selectedEmailId);
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) setShowKeys(v => !v);
      if (e.key === "i") setShowIntelligence(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filteredEmails, selectedEmailId, activeSection]);

  // Split tabs
  const splitTabs: Array<{ id: SplitTab; label: string; count: number }> = [
    { id: "all", label: "All", count: emails.filter(e => !e.isArchived).length },
    { id: "orders", label: "Orders", count: emails.filter(e => !e.isArchived && e.category === "orders").length },
    { id: "quotes", label: "Quotes", count: emails.filter(e => !e.isArchived && e.category === "quotes").length },
    { id: "suppliers", label: "Suppliers", count: emails.filter(e => !e.isArchived && e.category === "suppliers").length },
    { id: "shipping", label: "Shipping", count: emails.filter(e => !e.isArchived && e.category === "shipping").length },
    { id: "payments", label: "Payments", count: emails.filter(e => !e.isArchived && e.category === "payments").length },
  ];

  // Nav items
  const navItems: Array<{ id: NavSection; icon: typeof Mail; label: string; count?: number }> = [
    { id: "dashboard", icon: BarChart3, label: "Dashboard" },
    { id: "inbox", icon: Inbox, label: "Inbox", count: emails.filter(e => e.isUnread && !e.isArchived).length },
    { id: "pipeline", icon: Layers, label: "Pipeline", count: ORDERS.filter(o => o.slaBreached).length },
    { id: "orders", icon: ShoppingCart, label: "Orders", count: ORDERS.length },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "vendors", icon: Package, label: "Vendors" },
  ];

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* ═══════ NAV SIDEBAR ═══════ */}
      <div className="w-[52px] flex-none flex flex-col items-center py-3 gap-1 border-r border-zinc-800/60 bg-zinc-950">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-3">
          <span className="text-[10px] font-black text-violet-300 tracking-tighter">T</span>
        </div>

        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={cn(
              "relative w-9 h-9 rounded-lg flex items-center justify-center transition-all group",
              activeSection === item.id
                ? "bg-violet-500/10 text-violet-400"
                : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/40"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.count && item.count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 text-[7px] font-bold text-white flex items-center justify-center">
                {item.count > 9 ? "9+" : item.count}
              </span>
            )}
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {item.label}
            </span>
          </button>
        ))}

        <div className="flex-1" />
        <button
          onClick={() => setShowKeys(v => !v)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeSection === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <DashboardView onNavigate={navigateFromDashboard} />
            </motion.div>
          )}

          {activeSection === "inbox" && (
            <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex">
              {/* ═══════ EMAIL LIST ═══════ */}
              <div className="w-[340px] flex-none flex flex-col border-r border-zinc-800/60">
                {/* Search */}
                <div className="flex-none px-3 py-2.5 border-b border-zinc-800/60">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search emails..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900/50 border border-zinc-800/40 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30"
                    />
                  </div>
                </div>

                {/* Split Tabs */}
                <div className="flex-none px-2 py-1.5 border-b border-zinc-800/60 flex gap-0.5 overflow-x-auto">
                  {splitTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all",
                        activeTab === tab.id
                          ? "bg-violet-500/10 text-violet-300"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                      )}
                    >
                      {tab.label}
                      {tab.count > 0 && <span className="ml-1 text-zinc-600">{tab.count}</span>}
                    </button>
                  ))}
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredEmails.map(email => (
                    <button
                      key={email.id}
                      onClick={() => { setSelectedEmailId(email.id); setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isUnread: false } : e)); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 border-b border-zinc-800/20 border-l-2 transition-all",
                        URGENCY[email.urgency]?.border,
                        selectedEmailId === email.id ? "bg-violet-500/5" : "hover:bg-zinc-800/20",
                        email.isUnread && "bg-zinc-900/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {email.isUnread && <span className={cn("w-1.5 h-1.5 rounded-full flex-none", URGENCY[email.urgency]?.dot)} />}
                          <span className={cn("text-xs truncate", email.isUnread ? "font-semibold text-white" : "text-zinc-300")}>{email.from}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600 flex-none ml-2">{email.timeAgo}</span>
                      </div>
                      <p className={cn("text-[11px] truncate", email.isUnread ? "text-zinc-200" : "text-zinc-400")}>{email.subject}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-800/60 text-zinc-500">{email.aiCategory}</span>
                        {email.hasOrder && <ShoppingCart className="w-2.5 h-2.5 text-violet-400/60" />}
                        {email.isStarred && <Star className="w-2.5 h-2.5 text-amber-400/60 fill-amber-400/60" />}
                        {email.attachments.length > 0 && <Paperclip className="w-2.5 h-2.5 text-zinc-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══════ THREAD VIEW ═══════ */}
              <div className="flex-1 flex flex-col min-w-0">
                {selectedEmail ? (
                  <>
                    {/* Thread header */}
                    <div className="flex-none px-5 py-3 border-b border-zinc-800/60">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h2 className="text-sm font-semibold text-white truncate">{selectedEmail.subject}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-500">{selectedEmail.from} &lt;{selectedEmail.fromEmail}&gt;</span>
                            <span className="text-[10px] text-zinc-700">•</span>
                            <span className="text-[10px] text-zinc-600">{selectedEmail.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-none">
                          <button onClick={() => toggleStar(selectedEmail.id)} className="p-1.5 rounded-md hover:bg-zinc-800/40 transition-colors">
                            <Star className={cn("w-3.5 h-3.5", selectedEmail.isStarred ? "text-amber-400 fill-amber-400" : "text-zinc-600")} />
                          </button>
                          <button onClick={() => archiveEmail(selectedEmail.id)} className="p-1.5 rounded-md hover:bg-zinc-800/40 transition-colors">
                            <Archive className="w-3.5 h-3.5 text-zinc-600" />
                          </button>
                          <button onClick={() => setShowIntelligence(v => !v)} className="p-1.5 rounded-md hover:bg-zinc-800/40 transition-colors">
                            {showIntelligence ? <PanelRightClose className="w-3.5 h-3.5 text-zinc-600" /> : <PanelRightOpen className="w-3.5 h-3.5 text-zinc-600" />}
                          </button>
                        </div>
                      </div>

                      {/* AI Summary Bar */}
                      <div className="mt-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className="w-3 h-3 text-violet-400" />
                          <span className="text-[9px] text-violet-400 font-medium uppercase tracking-wider">AI Summary</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">{selectedEmail.aiSummary}</p>
                      </div>
                    </div>

                    {/* Email body */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-[13px] text-zinc-300 leading-relaxed font-[inherit]">
                          {selectedEmail.body}
                        </div>
                      </div>

                      {/* Attachments */}
                      {selectedEmail.attachments.length > 0 && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {selectedEmail.attachments.map(att => (
                            <div key={att} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900/60 border border-zinc-800/40 text-[10px] text-zinc-400">
                              <FileText className="w-3 h-3" />
                              {att}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-md bg-zinc-900/60 border border-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-colors">
                          <Reply className="w-3 h-3" /> Reply
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-md bg-zinc-900/60 border border-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-colors">
                          <Forward className="w-3 h-3" /> Forward
                        </button>
                        {!selectedEmail.hasOrder && selectedEmail.extraction && (
                          <button
                            onClick={() => createOrder(selectedEmail)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" /> Create Order
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-zinc-600">Select an email to read</p>
                  </div>
                )}
              </div>

              {/* ═══════ INTELLIGENCE PANEL ═══════ */}
              {showIntelligence && selectedEmail && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 300, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex-none w-[300px] border-l border-zinc-800/60 overflow-y-auto p-3 space-y-3"
                >
                  {/* Customer Card */}
                  {selectedEmail.customer && (
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                          <User className="w-3 h-3 text-violet-300" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{selectedEmail.customer.name}</p>
                          <span className={cn("text-[8px] px-1 py-0.5 rounded-full",
                            selectedEmail.customer.tier === "Platinum" ? "bg-violet-500/10 text-violet-400" :
                            selectedEmail.customer.tier === "Gold" ? "bg-amber-500/10 text-amber-400" :
                            "bg-zinc-800 text-zinc-500"
                          )}>{selectedEmail.customer.tier}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                        <div><span className="text-zinc-600">Lifetime</span><p className="text-zinc-200 font-semibold">{formatCurrency(selectedEmail.customer.totalRevenue)}</p></div>
                        <div><span className="text-zinc-600">Health</span><p className={cn("font-semibold", selectedEmail.customer.healthScore >= 80 ? "text-emerald-400" : selectedEmail.customer.healthScore >= 60 ? "text-amber-400" : "text-red-400")}>{selectedEmail.customer.healthScore}</p></div>
                        <div><span className="text-zinc-600">Open Orders</span><p className="text-zinc-200 font-semibold">{selectedEmail.customer.openOrders}</p></div>
                        <div><span className="text-zinc-600">Terms</span><p className="text-zinc-200 font-semibold">{selectedEmail.customer.paymentTerms}</p></div>
                      </div>
                    </div>
                  )}

                  {/* AI Extraction */}
                  {selectedEmail.extraction && (
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] text-violet-400 font-medium uppercase tracking-wider">AI Extraction</span>
                        <span className="ml-auto text-[8px] text-zinc-600">{Math.round(selectedEmail.extraction.confidence * 100)}% confidence</span>
                      </div>
                      <div className="space-y-1">
                        {selectedEmail.extraction.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-zinc-800/20 last:border-0">
                            <div>
                              <p className="text-[10px] text-zinc-300">{item.product}</p>
                              <span className="text-[9px] text-zinc-600">{item.qty} × {formatCurrencyExact(item.price)}</span>
                            </div>
                            <span className={cn("text-[8px] px-1 py-0.5 rounded",
                              item.status === "In Stock" ? "bg-emerald-500/10 text-emerald-400" :
                              item.status === "Low Stock" ? "bg-amber-500/10 text-amber-400" :
                              "bg-zinc-800 text-zinc-500"
                            )}>{item.status}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-800/30 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500">Total</span>
                        <span className="text-xs font-bold text-white tabular-nums">{formatCurrencyExact(selectedEmail.extraction.total)}</span>
                      </div>
                      {selectedEmail.extraction.shipBy && (
                        <div className="flex items-center gap-1 mt-1">
                          <Truck className="w-2.5 h-2.5 text-zinc-600" />
                          <span className="text-[9px] text-zinc-500">Ship by {selectedEmail.extraction.shipBy}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Three-Way Pricing */}
                  {selectedEmail.threeWay && (
                    <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">3-Way Pricing</span>
                        </div>
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-medium",
                          SCENARIO_CONFIG[selectedEmail.threeWay.scenario]?.bg,
                          SCENARIO_CONFIG[selectedEmail.threeWay.scenario]?.color
                        )}>
                          {SCENARIO_CONFIG[selectedEmail.threeWay.scenario]?.label}
                        </span>
                      </div>

                      {/* Three-Way Bar */}
                      <div className="space-y-1.5">
                        {[
                          { label: "Vendor Cost", value: selectedEmail.threeWay.vendorCost, color: "bg-red-500/60" },
                          { label: "Our Offer", value: selectedEmail.threeWay.ourOffer, color: "bg-violet-500/60" },
                          { label: "Customer Ask", value: selectedEmail.threeWay.customerAsk, color: "bg-emerald-500/60" },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between text-[9px] mb-0.5">
                              <span className="text-zinc-500">{row.label}</span>
                              <span className="text-zinc-300 font-mono tabular-nums">{formatCurrencyExact(row.value)}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", row.color)}
                                style={{ width: `${(row.value / selectedEmail.threeWay!.customerAsk) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-800/30 flex items-center justify-between">
                        <span className="text-[9px] text-zinc-500">Margin</span>
                        <span className={cn("text-sm font-bold tabular-nums",
                          selectedEmail.threeWay.margin >= 15 ? "text-emerald-400" :
                          selectedEmail.threeWay.margin >= 10 ? "text-amber-400" : "text-red-400"
                        )}>
                          {selectedEmail.threeWay.margin}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Linked Order */}
                  {selectedEmail.orderId && (
                    <button
                      onClick={() => navigateToOrder(selectedEmail.orderId!)}
                      className="w-full p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40 hover:border-zinc-700/40 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3 h-3 text-violet-400" />
                          <span className="text-[9px] text-violet-400 font-medium uppercase tracking-wider">Linked Order</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-600" />
                      </div>
                      {(() => {
                        const order = ORDERS.find(o => o.id === selectedEmail.orderId);
                        if (!order) return null;
                        const stage = STAGE_PIPELINE.find(s => s.code === order.stageCode);
                        return (
                          <div className="mt-1.5">
                            <span className="text-[10px] font-mono text-zinc-400">#{order.orderNumber}</span>
                            <span className={cn("ml-1.5 text-[8px] px-1 py-0.5 rounded", stage?.bgColor, stage?.color)}>{order.stageCode}</span>
                            <p className="text-[10px] text-zinc-300 mt-0.5">{order.brand} — {formatCurrency(order.totalAmount)}</p>
                          </div>
                        );
                      })()}
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeSection === "pipeline" && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <PipelineView onNavigateToOrder={navigateToOrder} />
            </motion.div>
          )}

          {activeSection === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <OrdersView onNavigateToEmail={navigateToEmail} />
            </motion.div>
          )}

          {activeSection === "customers" && (
            <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <CustomersView />
            </motion.div>
          )}

          {activeSection === "vendors" && (
            <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <VendorsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ TOASTS ═══════ */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-200 flex items-center gap-2 shadow-lg"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══════ KEYBOARD SHORTCUTS ═══════ */}
      <AnimatePresence>
        {showKeys && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKeys(false)}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-80 rounded-xl bg-zinc-900 border border-zinc-800/60 p-5 shadow-2xl"
            >
              <h3 className="text-sm font-semibold text-white mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { key: "j/k", action: "Navigate emails" },
                  { key: "e", action: "Archive" },
                  { key: "s", action: "Star/unstar" },
                  { key: "i", action: "Toggle intelligence panel" },
                  { key: "?", action: "Show shortcuts" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">{s.action}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">{s.key}</kbd>
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
