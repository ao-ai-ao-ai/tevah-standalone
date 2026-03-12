/**
 * WishlistView — Demand Signal Hub
 *
 * Living, breathing demand signals. Per-customer, per-brand.
 * Auto-populated from orders, emails, inquiries, targets.
 * The engine that drives 99% of deals — "we work off demand, not inventory."
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { ALL_DEALS, ALL_CUSTOMERS } from "../data/monday";
import {
  Search, Sparkles, Target, TrendingUp, ShoppingBag, Eye,
  ArrowRight, Zap, Filter, BarChart3, Users, Package,
} from "lucide-react";

// ── Signal Types ─────────────────────────────────────────────────────

type SignalType = "repeat" | "explicit" | "inferred" | "target" | "competitor" | "cross_sell";
type SignalStatus = "active" | "hunting" | "matched" | "contacted" | "converted" | "stale";

interface DemandSignal {
  id: string;
  customer: string;
  brand: string;
  signalType: SignalType;
  status: SignalStatus;
  strength: number; // 0-100
  lastSeen: string;
  source: string;
  estimatedValue: number;
  notes: string;
}

const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; bg: string; strength: number }> = {
  repeat: { label: "Repeat", color: "text-purple-600", bg: "bg-purple-50", strength: 100 },
  competitor: { label: "Competitor", color: "text-red-600", bg: "bg-red-50", strength: 90 },
  explicit: { label: "Explicit", color: "text-blue-600", bg: "bg-blue-50", strength: 80 },
  inferred: { label: "Inferred", color: "text-amber-600", bg: "bg-amber-50", strength: 60 },
  target: { label: "Target", color: "text-emerald-600", bg: "bg-emerald-50", strength: 50 },
  cross_sell: { label: "Cross-Sell", color: "text-violet-600", bg: "bg-violet-50", strength: 30 },
};

const STATUS_CONFIG: Record<SignalStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-blue-600", bg: "bg-blue-50" },
  hunting: { label: "Hunting", color: "text-amber-600", bg: "bg-amber-50" },
  matched: { label: "Matched", color: "text-purple-600", bg: "bg-purple-50" },
  contacted: { label: "Contacted", color: "text-cyan-600", bg: "bg-cyan-50" },
  converted: { label: "Converted", color: "text-emerald-600", bg: "bg-emerald-50" },
  stale: { label: "Stale", color: "text-text-tertiary", bg: "bg-canvas" },
};

// ── Generate signals from deal data ──────────────────────────────────

function generateSignals(): DemandSignal[] {
  const signals: DemandSignal[] = [];
  const customerBrands: Record<string, Set<string>> = {};

  // Build customer-brand relationships from deals
  ALL_DEALS.forEach(deal => {
    if (!deal.customer || !deal.brand) return;
    if (!customerBrands[deal.customer]) customerBrands[deal.customer] = new Set();
    customerBrands[deal.customer].add(deal.brand);
  });

  // Generate repeat signals (customers who ordered a brand multiple times)
  const brandCounts: Record<string, Record<string, number>> = {};
  ALL_DEALS.forEach(deal => {
    if (!deal.customer || !deal.brand) return;
    if (!brandCounts[deal.customer]) brandCounts[deal.customer] = {};
    brandCounts[deal.customer][deal.brand] = (brandCounts[deal.customer][deal.brand] || 0) + 1;
  });

  let id = 0;
  Object.entries(brandCounts).forEach(([customer, brands]) => {
    Object.entries(brands).forEach(([brand, count]) => {
      if (count >= 2) {
        signals.push({
          id: `sig-${id++}`,
          customer, brand,
          signalType: "repeat",
          status: count >= 3 ? "active" : "hunting",
          strength: Math.min(100, 50 + count * 15),
          lastSeen: `${Math.floor(Math.random() * 14) + 1}d ago`,
          source: `${count} previous orders`,
          estimatedValue: count * 25000,
          notes: `Ordered ${count}x. Avg deal $${(count * 25).toFixed(0)}K.`,
        });
      }
    });
  });

  // Generate cross-sell signals (customer buys brand X, other customers also buy brand Y)
  const brandCustomers: Record<string, string[]> = {};
  ALL_DEALS.forEach(deal => {
    if (!deal.brand || !deal.customer) return;
    if (!brandCustomers[deal.brand]) brandCustomers[deal.brand] = [];
    if (!brandCustomers[deal.brand].includes(deal.customer)) {
      brandCustomers[deal.brand].push(deal.customer);
    }
  });

  // Find top brands not yet sold to top customers
  const topCustomers = ALL_CUSTOMERS.slice(0, 10).map(c => c.name);
  const topBrands = Object.entries(brandCustomers)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 15)
    .map(([brand]) => brand);

  topCustomers.forEach(customer => {
    const customerExistingBrands = customerBrands[customer] || new Set();
    topBrands.forEach(brand => {
      if (!customerExistingBrands.has(brand) && Math.random() > 0.7) {
        signals.push({
          id: `sig-${id++}`,
          customer, brand,
          signalType: "cross_sell",
          status: "active",
          strength: 30 + Math.floor(Math.random() * 20),
          lastSeen: `${Math.floor(Math.random() * 30) + 1}d ago`,
          source: `${(brandCustomers[brand] || []).length} other customers buy this`,
          estimatedValue: 15000 + Math.floor(Math.random() * 40000),
          notes: `Popular with ${(brandCustomers[brand] || []).length} customers. Untapped for ${customer}.`,
        });
      }
    });
  });

  // Add some explicit/target signals
  const sampleTargets = [
    { customer: "Rue Gilt Groupe", brand: "Diptyque", type: "explicit" as SignalType, value: 120000, note: "Email inquiry Jan 15. Looking for closeouts." },
    { customer: "NR United", brand: "Samsonite", type: "target" as SignalType, value: 85000, note: "Monthly target. Volume buyer." },
    { customer: "Central Gifts", brand: "Adidas", type: "explicit" as SignalType, value: 200000, note: "Avi spoke with buyer. Wants Samba + Gazelle." },
    { customer: "Inventory Partners", brand: "OXO", type: "repeat" as SignalType, value: 45000, note: "3rd order this quarter. Growing account." },
    { customer: "DUFFL", brand: "L'Oreal", type: "competitor" as SignalType, value: 95000, note: "Currently sourcing from competitor. Price match opportunity." },
    { customer: "Steven Dann", brand: "Hugo Boss", type: "target" as SignalType, value: 65000, note: "From Yaakov's customer call notes." },
  ];

  sampleTargets.forEach(t => {
    signals.push({
      id: `sig-${id++}`,
      customer: t.customer, brand: t.brand,
      signalType: t.type,
      status: t.type === "competitor" ? "hunting" : "active",
      strength: SIGNAL_CONFIG[t.type].strength,
      lastSeen: `${Math.floor(Math.random() * 7) + 1}d ago`,
      source: t.type === "explicit" ? "Email inquiry" : t.type === "competitor" ? "Market intel" : "Internal target",
      estimatedValue: t.value,
      notes: t.note,
    });
  });

  return signals.sort((a, b) => b.strength - a.strength);
}

// ── Tabs ─────────────────────────────────────────────────────────────

type ViewTab = "opportunities" | "by-customer" | "by-brand" | "analytics";

// ── Component ────────────────────────────────────────────────────────

export default function WishlistView() {
  const [activeTab, setActiveTab] = useState<ViewTab>("opportunities");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<SignalType | "all">("all");

  const signals = useMemo(() => generateSignals(), []);

  const filtered = useMemo(() => {
    return signals
      .filter(s => filterType === "all" || s.signalType === filterType)
      .filter(s => !searchQuery ||
        s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [signals, filterType, searchQuery]);

  // Stats
  const totalValue = signals.reduce((s, sig) => s + sig.estimatedValue, 0);
  const activeCount = signals.filter(s => s.status === "active" || s.status === "hunting").length;
  const matchedCount = signals.filter(s => s.status === "matched" || s.status === "contacted").length;
  const convertedCount = signals.filter(s => s.status === "converted").length;

  // By customer
  const byCustomer = useMemo(() => {
    const map: Record<string, DemandSignal[]> = {};
    filtered.forEach(s => {
      if (!map[s.customer]) map[s.customer] = [];
      map[s.customer].push(s);
    });
    return Object.entries(map)
      .map(([name, sigs]) => ({ name, signals: sigs, totalValue: sigs.reduce((s, sig) => s + sig.estimatedValue, 0) }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [filtered]);

  // By brand
  const byBrand = useMemo(() => {
    const map: Record<string, DemandSignal[]> = {};
    filtered.forEach(s => {
      if (!map[s.brand]) map[s.brand] = [];
      map[s.brand].push(s);
    });
    return Object.entries(map)
      .map(([name, sigs]) => ({ name, signals: sigs, customerCount: new Set(sigs.map(s => s.customer)).size, totalValue: sigs.reduce((s, sig) => s + sig.estimatedValue, 0) }))
      .sort((a, b) => b.customerCount - a.customerCount);
  }, [filtered]);

  const tabs: Array<{ id: ViewTab; label: string; icon: typeof Target }> = [
    { id: "opportunities", label: "Opportunities", icon: Sparkles },
    { id: "by-customer", label: "By Customer", icon: Users },
    { id: "by-brand", label: "By Brand", icon: Package },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-divider bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-purple-600" />
            <h1 className="text-lg font-semibold text-text-primary">Wishlist</h1>
            <span className="text-xs text-text-tertiary">Demand Signal Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
              {signals.length} signals
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-600 font-medium">
              {formatCurrency(totalValue)} potential
            </span>
          </div>
        </div>

        {/* AI one-liner */}
        <p className="text-[11px] text-text-tertiary italic mb-3">
          {activeCount} active signals hunting across {new Set(signals.map(s => s.brand)).size} brands. {matchedCount} matched, ready for outreach.
        </p>

        {/* Tabs + Search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-selected text-purple-600 border border-purple-200"
                    : "text-text-secondary hover:text-text-primary hover:bg-hover"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search signals..."
              className="w-48 h-8 pl-8 pr-3 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-purple-300"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === "opportunities" && (
            <motion.div key="opp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Filter chips */}
              <div className="flex items-center gap-1.5 mb-2">
                <Filter className="w-3 h-3 text-text-tertiary" />
                <button
                  onClick={() => setFilterType("all")}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                    filterType === "all" ? "bg-purple-50 text-purple-600" : "text-text-tertiary hover:text-text-secondary"
                  )}
                >All</button>
                {(Object.entries(SIGNAL_CONFIG) as [SignalType, typeof SIGNAL_CONFIG[SignalType]][]).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn("px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                      filterType === type ? cn(config.bg, config.color) : "text-text-tertiary hover:text-text-secondary"
                    )}
                  >{config.label}</button>
                ))}
              </div>

              {/* Signal list */}
              {filtered.map((signal, idx) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                >
                  <Card variant="interactive" className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Strength indicator */}
                      <div className="flex flex-col items-center gap-0.5 pt-0.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border",
                          signal.strength >= 80 ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                          signal.strength >= 50 ? "bg-amber-50 border-amber-200 text-amber-600" :
                          "bg-canvas border-divider text-text-tertiary"
                        )}>
                          {signal.strength}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            SIGNAL_CONFIG[signal.signalType].bg, SIGNAL_CONFIG[signal.signalType].color,
                          )}>
                            {SIGNAL_CONFIG[signal.signalType].label}
                          </span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded",
                            STATUS_CONFIG[signal.status].bg, STATUS_CONFIG[signal.status].color,
                          )}>
                            {STATUS_CONFIG[signal.status].label}
                          </span>
                          <span className="text-[10px] text-text-tertiary">{signal.lastSeen}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{signal.brand}</span>
                          <ArrowRight className="w-3 h-3 text-text-disabled" />
                          <span className="text-sm text-text-secondary">{signal.customer}</span>
                        </div>

                        <p className="text-xs text-text-tertiary mt-1">{signal.notes}</p>
                        <p className="text-[10px] text-text-disabled mt-0.5">Source: {signal.source}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(signal.estimatedValue)}</p>
                        <p className="text-[10px] text-text-tertiary">est. value</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "by-customer" && (
            <motion.div key="cust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {byCustomer.slice(0, 15).map(group => (
                <Card key={group.name} variant="elevated" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-sm font-semibold text-text-primary">{group.name}</span>
                      <span className="text-[10px] text-text-tertiary">{group.signals.length} signals</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-purple-600">{formatCurrency(group.totalValue)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.signals.slice(0, 6).map(s => (
                      <span key={s.id} className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        SIGNAL_CONFIG[s.signalType].bg, SIGNAL_CONFIG[s.signalType].color,
                        "border-current/10"
                      )}>
                        {s.brand}
                      </span>
                    ))}
                    {group.signals.length > 6 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-text-tertiary">
                        +{group.signals.length - 6} more
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === "by-brand" && (
            <motion.div key="brand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {byBrand.slice(0, 15).map(group => (
                <Card key={group.name} variant="elevated" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-sm font-semibold text-text-primary">{group.name}</span>
                      <span className="text-[10px] text-text-tertiary">{group.customerCount} customers want this</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-600">{formatCurrency(group.totalValue)}</span>
                  </div>
                  {group.customerCount >= 3 && (
                    <div className="flex items-center gap-1.5 mt-1 p-2 rounded-lg bg-purple-50 border border-purple-200">
                      <Zap className="w-3 h-3 text-purple-600" />
                      <span className="text-[10px] text-purple-600 font-medium">
                        Volume opportunity: {group.customerCount} customers. Negotiate bulk pricing.
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {group.signals.slice(0, 5).map(s => (
                      <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-canvas text-text-secondary border border-divider">
                        {s.customer}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Active Signals", value: String(activeCount), icon: Eye, color: "text-blue-600", bg: "from-blue-50 to-blue-50/30" },
                  { label: "Matched", value: String(matchedCount), icon: Target, color: "text-purple-600", bg: "from-purple-50 to-purple-50/30" },
                  { label: "Converted", value: String(convertedCount), icon: TrendingUp, color: "text-emerald-600", bg: "from-emerald-50 to-emerald-50/30" },
                ].map(stat => (
                  <Card key={stat.label} variant="kpi" className={cn("p-4 bg-gradient-to-br", stat.bg)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">{stat.label}</span>
                      <stat.icon className={cn("w-4 h-4", stat.color)} />
                    </div>
                    <p className={cn("text-2xl font-mono font-bold tabular-nums", stat.color)}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              <Card variant="elevated" className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">Signal Distribution</h3>
                <div className="space-y-3">
                  {(Object.entries(SIGNAL_CONFIG) as [SignalType, typeof SIGNAL_CONFIG[SignalType]][]).map(([type, config]) => {
                    const count = signals.filter(s => s.signalType === type).length;
                    const pct = signals.length > 0 ? (count / signals.length * 100) : 0;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className={cn("text-[10px] font-medium w-20", config.color)}>{config.label}</span>
                        <div className="flex-1 h-2 bg-canvas rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", config.bg.replace("bg-", "bg-").replace("-50", "-300"))}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-text-tertiary w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
