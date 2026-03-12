/**
 * TEVAH — Built for the Three-Party Deal
 * ========================================
 * The Call as home. 20 screens. DSV2 design system.
 * URL routing via react-router-dom.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Inbox,
  Zap, BarChart3, Users, Layers,
  Package, ShoppingCart, ShoppingBag, Box,
  Command, Check, DollarSign, Target, Tag,
  Receipt, Truck, FileText, Shield, ClipboardList,
  Radar,
} from "lucide-react";
import { cn } from "./lib/utils";
import { isSlaBreached } from "./data/emails";
import { ALL_DEALS } from "./data/monday";
import { getDecisions } from "./data/decisions";
import { BoatLogo } from "./components/boat-logo";
import { AtmosphericBackground } from "./components/atmospheric-bg";
import { CommandPalette, type NavSection } from "./components/command-palette";
import { Card } from "./components/card";

// Views
import { TheCallView } from "./views/TheCallView";
import DashboardView from "./views/DashboardView";
import PipelineView from "./views/PipelineView";
import OrdersView from "./views/OrdersView";
import { OrderDetailView } from "./views/OrderDetailView";
import CustomersView from "./views/CustomersView";
import VendorsView from "./views/VendorsView";
import { BuysView } from "./views/BuysView";
import { ItemsView } from "./views/ItemsView";
import FinanceView from "./views/FinanceView";
import WishlistView from "./views/WishlistView";
import BrandsView from "./views/BrandsView";
import { InboxView } from "./views/InboxView";
import { OffersView } from "./views/OffersView";
import AnalyticsView from "./views/AnalyticsView";
import { ActivityView } from "./views/ActivityView";
// New views
import { InvoicesView } from "./views/InvoicesView";
import { ShippingView } from "./views/ShippingView";
import { DocumentsView } from "./views/DocumentsView";
import { AuditView } from "./views/AuditView";
import { PurchaseOrdersView } from "./views/PurchaseOrdersView";
import { ReconView } from "./views/ReconView";

// ============================================================================
// Route → section mapping
// ============================================================================

type ExtendedNav = NavSection | "invoices" | "shipping" | "documents" | "audit" | "purchase-orders" | "recon";

const ROUTE_MAP: Record<string, ExtendedNav> = {
  "/": "the-call",
  "/dashboard": "dashboard",
  "/inbox": "inbox",
  "/pipeline": "pipeline",
  "/orders": "orders",
  "/offers": "offers",
  "/purchase-orders": "purchase-orders",
  "/customers": "customers",
  "/vendors": "vendors",
  "/invoices": "invoices",
  "/shipping": "shipping",
  "/documents": "documents",
  "/items": "items",
  "/buys": "buys",
  "/brands": "brands",
  "/wishlist": "wishlist",
  "/finance": "finance",
  "/analytics": "analytics",
  "/audit": "audit",
  "/activity": "activity",
  "/recon": "recon",
};

const SECTION_TO_PATH: Record<ExtendedNav, string> = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([path, section]) => [section, path])
) as Record<ExtendedNav, string>;

// ============================================================================
// SHELL (sidebar + content)
// ============================================================================

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  // Easter egg: 5-click logo → Harvest
  const logoClickRef = useRef({ count: 0, timer: 0 as ReturnType<typeof setTimeout> });
  const handleLogoClick = useCallback(() => {
    const lc = logoClickRef.current;
    clearTimeout(lc.timer);
    lc.count += 1;
    if (lc.count >= 5) {
      lc.count = 0;
      window.location.href = "https://harvest.158-101-101-234.sslip.io";
    } else {
      lc.timer = setTimeout(() => { lc.count = 0; }, 2000);
    }
  }, []);

  // Derive active section from URL
  const activeSection: ExtendedNav = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/orders/")) return "orders";
    return ROUTE_MAP[path] || "the-call";
  }, [location.pathname]);

  // Extract order ID from URL
  useEffect(() => {
    const match = location.pathname.match(/^\/orders\/(.+)$/);
    if (match) setSelectedOrderId(match[1]);
    else if (location.pathname === "/orders") setSelectedOrderId(null);
  }, [location.pathname]);

  // Navigation helpers
  const navigateTo = (section: ExtendedNav) => {
    const path = SECTION_TO_PATH[section] || "/";
    navigate(path);
  };

  const navigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const navigateFromDashboard = (section: string, _id?: string) => {
    const path = SECTION_TO_PATH[section as ExtendedNav] || "/";
    navigate(path);
  };

  const navigateFromPalette = (section: NavSection, _id?: string) => {
    if (section === "orders" && _id) {
      navigate(`/orders/${_id}`);
    } else {
      const path = SECTION_TO_PATH[section] || "/";
      navigate(path);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(v => !v);
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) setShowKeys(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Counts
  const decisions = useMemo(() => getDecisions(), []);
  const activeDealCount = useMemo(() => ALL_DEALS.filter(d => !["Won", "Lost"].includes(d.stage)).length, []);
  const breachedCount = useMemo(() => ALL_DEALS.filter(d => !["Won", "Lost"].includes(d.stage) && isSlaBreached(d)).length, []);
  const overdueCount = useMemo(() => ALL_DEALS.filter(d => d.payment === "Overdue").length, []);

  const navItems: Array<{ id: ExtendedNav; icon: typeof Mail; label: string; count?: number; accent?: boolean; separator?: boolean }> = [
    { id: "the-call", icon: Zap, label: "The Call", count: decisions.length > 0 ? decisions.length : undefined, accent: true },
    { id: "dashboard", icon: BarChart3, label: "Dashboard", separator: true },
    { id: "inbox", icon: Inbox, label: "Inbox" },
    { id: "pipeline", icon: Layers, label: "Pipeline", count: breachedCount > 0 ? breachedCount : undefined },
    { id: "orders", icon: ShoppingCart, label: "Orders", count: activeDealCount },
    { id: "offers", icon: Tag, label: "Offers" },
    { id: "purchase-orders", icon: ClipboardList, label: "VPOs" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "vendors", icon: Package, label: "Vendors", separator: true },
    { id: "invoices", icon: Receipt, label: "Invoices", count: overdueCount > 0 ? overdueCount : undefined },
    { id: "shipping", icon: Truck, label: "Shipping" },
    { id: "documents", icon: FileText, label: "Documents" },
    { id: "items", icon: Box, label: "Items" },
    { id: "buys", icon: ShoppingBag, label: "Buys", separator: true },
    { id: "brands", icon: Tag, label: "Brands" },
    { id: "wishlist", icon: Target, label: "Wishlist" },
    { id: "finance", icon: DollarSign, label: "Finance" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "audit", icon: Shield, label: "Audit" },
    { id: "activity", icon: Zap, label: "Activity", separator: true },
    { id: "recon", icon: Radar, label: "Recon", accent: true },
  ];

  return (
    <div className="h-screen flex bg-canvas text-text-primary overflow-hidden select-none">
      <AtmosphericBackground />

      {/* NAV SIDEBAR */}
      <motion.div
        className="flex-none flex flex-col items-center py-3 gap-1 border-r border-divider bg-sidebar z-10"
        animate={{ width: sidebarExpanded ? 180 : 52 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="mb-3 flex items-center gap-2 px-1.5 w-full justify-center" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
          <BoatLogo size={32} />
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-bold tracking-wide overflow-hidden whitespace-nowrap text-lavender-500"
              >
                TEVAH
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none w-full space-y-0.5 px-1.5">
          {navItems.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && navItems[idx - 1]?.separator && (
                <div className="w-6 mx-auto border-t border-divider my-1.5" />
              )}
              <button
                onClick={() => navigateTo(item.id)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg transition-all w-full px-2",
                  sidebarExpanded ? "h-8 justify-start" : "h-8 w-8 justify-center mx-auto",
                  activeSection === item.id
                    ? item.accent ? "bg-purple-50 text-purple-600" : "bg-hover text-purple-600"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-hover"
                )}
              >
                <item.icon className="w-4 h-4 flex-none" />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.count && item.count > 0 && (
                  <span className={cn(
                    "absolute rounded-full text-[7px] font-bold text-white flex items-center justify-center",
                    item.accent ? "bg-purple-500" : "bg-lavender-500",
                    sidebarExpanded ? "right-2 w-5 h-4" : "-top-0.5 -right-0.5 w-3.5 h-3.5"
                  )}>
                    {item.count > 99 ? "99" : item.count}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowCommandPalette(true)}
          className={cn(
            "flex items-center gap-2 rounded-lg text-text-tertiary hover:text-purple-600 hover:bg-hover transition-colors mt-1",
            sidebarExpanded ? "w-full px-2 h-8 justify-start mx-1.5" : "w-8 h-8 justify-center"
          )}
        >
          <Command className="w-4 h-4 flex-none" />
          {sidebarExpanded && (
            <span className="text-[10px] text-text-tertiary">
              <kbd className="px-1 py-0.5 rounded bg-white text-text-tertiary border border-divider text-[9px] shadow-[var(--shadow-sm)]">⌘K</kbd>
            </span>
          )}
        </button>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <Routes>
              <Route path="/" element={<TheCallView onNavigate={navigateFromDashboard} />} />
              <Route path="/dashboard" element={<DashboardView onNavigate={navigateFromDashboard} />} />
              <Route path="/inbox" element={<InboxView />} />
              <Route path="/pipeline" element={<PipelineView onNavigateToOrder={navigateToOrder} />} />
              <Route path="/orders/:orderId" element={<OrderDetailView dealId={selectedOrderId || ""} onBack={() => navigate("/orders")} />} />
              <Route path="/orders" element={<OrdersView onNavigateToOrder={navigateToOrder} />} />
              <Route path="/offers" element={<OffersView />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersView />} />
              <Route path="/customers" element={<CustomersView />} />
              <Route path="/vendors" element={<VendorsView />} />
              <Route path="/invoices" element={<InvoicesView />} />
              <Route path="/shipping" element={<ShippingView />} />
              <Route path="/documents" element={<DocumentsView />} />
              <Route path="/items" element={<ItemsView onNavigate={navigateFromDashboard} />} />
              <Route path="/buys" element={<BuysView onNavigate={navigateFromDashboard} />} />
              <Route path="/brands" element={<BrandsView />} />
              <Route path="/wishlist" element={<WishlistView />} />
              <Route path="/finance" element={<FinanceView />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="/audit" element={<AuditView />} />
              <Route path="/activity" element={<ActivityView />} />
              <Route path="/recon" element={<ReconView />} />
              {/* Fallback */}
              <Route path="*" element={<TheCallView onNavigate={navigateFromDashboard} />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={navigateFromPalette}
      />

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="px-4 py-2.5 rounded-lg bg-white/90 backdrop-blur-xl border border-divider text-xs text-text-primary flex items-center gap-2 shadow-[var(--shadow-md)]">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts */}
      <AnimatePresence>
        {showKeys && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowKeys(false)} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Card variant="elevated" className="w-80 p-5 shadow-[var(--shadow-lg)]" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Keyboard Shortcuts</h3>
              <div className="space-y-1.5 text-xs">
                {[
                  { key: "⌘K", action: "Command palette" },
                  { key: "1/2/3/4", action: "Execute action (The Call)" },
                  { key: "j/k", action: "Navigate cards / emails" },
                  { key: "Tab", action: "Next split (The Call)" },
                  { key: "e", action: "Expand card / Archive email" },
                  { key: "z", action: "Undo last decision" },
                  { key: "?", action: "Show shortcuts" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-text-secondary">{s.action}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-canvas text-text-primary font-mono text-[10px] border border-divider">{s.key}</kbd>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// ROOT — wraps everything in BrowserRouter
// ============================================================================

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <AppShell />
    </BrowserRouter>
  );
}
