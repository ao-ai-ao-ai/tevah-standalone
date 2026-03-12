/**
 * ReconView — SIGINT Intelligence Dashboard
 * ==========================================
 * 3-level buying group intelligence view.
 * Uses ALL premium tools: GSAP, Swiper, Fuse.js, ApexCharts, Tippy, Notyf, Lenis.
 *
 * Level 1: Gallery — buying group carousel + radar sweep
 * Level 2: Vendor Grid — search, filter, treemap, sortable cards
 * Level 3: Vendor Drawer — smooth-scroll detail panel
 */

import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Fuse from "fuse.js";
import Tippy from "@tippyjs/react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-cards";
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, ExternalLink,
  Users, FileText, Mail, Phone, AlertTriangle, Activity,
  Copy, Check, Filter, ArrowUpDown, X, Radar, Eye,
  Download, Globe, MapPin, Tag, Clock, Hash, Zap,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useRecon } from "../data/recon";
import type { ReconVendor, VendorSignal, VendorContact } from "../data/recon";

// Lazy ApexCharts
const Chart = lazy(() => import("react-apexcharts"));

// ── Notyf singleton ──────────────────────────────────────────────────
let _notyf: Notyf | null = null;
function getNotyf() {
  if (!_notyf) {
    _notyf = new Notyf({
      duration: 2500,
      position: { x: "right", y: "bottom" },
      types: [
        { type: "info", background: "#0E7490", icon: false },
        { type: "success", background: "#059669", icon: false },
      ],
    });
  }
  return _notyf;
}

// ── Constants ────────────────────────────────────────────────────────
type FilterKey = "hasDiscount" | "hasFiles" | "hasContacts" | "hasSignals";
type SortKey = "name" | "contacts" | "files" | "discount";
type Level = 1 | 2 | 3;

const SEVERITY_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  HIGH: { text: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-500" },
  MEDIUM: { text: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  LOW: { text: "text-cyan-400", bg: "bg-cyan-500/10", dot: "bg-cyan-500" },
};

// ── Helpers ──────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(/[\s\-(),]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function timeAgo(iso?: string) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "text-red-400";
  if (["xlsx", "xls", "xlsb"].includes(ext)) return "text-emerald-400";
  if (["docx", "doc"].includes(ext)) return "text-blue-400";
  return "text-white/40";
}

function roleLabel(r: string) {
  const map: Record<string, string> = {
    customer_service: "Customer Service", purchase_orders: "Purchase Orders",
    credit: "Credit", sales: "Sales", general: "General",
  };
  return map[r] || r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ════════════════════════════════════════════════════════════════════
//  RECON VIEW — Main Export
// ════════════════════════════════════════════════════════════════════

export function ReconView() {
  const { data, loading, error, refresh } = useRecon();
  const [level, setLevel] = useState<Level>(1);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<ReconVendor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToGroup = useCallback((group: string) => {
    setSelectedGroup(group);
    setLevel(2);
  }, []);

  const goToVendor = useCallback((vendor: ReconVendor) => {
    setSelectedVendor(vendor);
    setLevel(3);
  }, []);

  const goBack = useCallback(() => {
    if (level === 3) { setSelectedVendor(null); setLevel(2); }
    else if (level === 2) { setSelectedGroup(null); setLevel(1); }
  }, [level]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goBack]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #0B1120 100%)" }}>
      {/* Radar grid background */}
      <RadarBackground />

      {/* Content */}
      <div className="relative z-10 h-full">
        <AnimatePresence mode="wait">
          {level === 1 && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="h-full">
              <ReconGallery data={data} loading={loading} error={error} onRefresh={refresh} onSelectGroup={goToGroup} />
            </motion.div>
          )}
          {level === 2 && data && (
            <motion.div key="grid" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="h-full">
              <VendorGrid data={data} onBack={goBack} onSelectVendor={goToVendor} onRefresh={refresh} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vendor Drawer (Level 3 — overlay) */}
        <AnimatePresence>
          {level === 3 && selectedVendor && (
            <VendorDrawer vendor={selectedVendor} onClose={goBack} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  RADAR BACKGROUND — CSS + GSAP rotating scan line
// ════════════════════════════════════════════════════════════════════

function RadarBackground() {
  const scanRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!scanRef.current) return;
    gsap.to(scanRef.current, { rotation: 360, duration: 6, repeat: -1, ease: "none" });
  }, { scope: scanRef });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Concentric rings */}
      {[20, 35, 50, 65].map((size, i) => (
        <div key={i} className="absolute rounded-full border border-cyan-500/[0.04]"
          style={{ width: `${size}vw`, height: `${size}vw`, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
      ))}
      {/* Scan line */}
      <div ref={scanRef} className="absolute" style={{ width: "50vw", height: "2px", left: "50%", top: "50%", transformOrigin: "0% 50%" }}>
        <div className="h-full w-full" style={{
          background: "linear-gradient(90deg, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0) 100%)",
        }} />
      </div>
      {/* Grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(rgba(34,211,238,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  LEVEL 1 — Gallery
// ════════════════════════════════════════════════════════════════════

interface GalleryProps {
  data: ReturnType<typeof useRecon>["data"];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelectGroup: (group: string) => void;
}

function ReconGallery({ data, loading, error, onRefresh, onSelectGroup }: GalleryProps) {
  const statsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stats = data?.stats;

  // GSAP entrance + count-up
  useGSAP(() => {
    if (!titleRef.current) return;
    gsap.fromTo(titleRef.current, { opacity: 0, y: -20, letterSpacing: "0.8em" }, { opacity: 1, y: 0, letterSpacing: "0.3em", duration: 1.2, ease: "power3.out" });
  }, { scope: titleRef });

  useGSAP(() => {
    if (!statsRef.current || !stats) return;
    const counters = statsRef.current.querySelectorAll("[data-count]");
    counters.forEach((el, i) => {
      const target = parseInt(el.getAttribute("data-count") || "0", 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.8, delay: 0.3 + i * 0.15, ease: "power2.out",
        onUpdate() { el.textContent = Math.round(obj.v).toLocaleString(); },
      });
    });
  }, { scope: statsRef, dependencies: [stats] });

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-white/50 text-sm mb-4">Signal lost. {error}</p>
          <button onClick={onRefresh} className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 ref={titleRef} className="text-4xl font-bold tracking-[0.3em] uppercase text-cyan-400 mb-2" style={{ textShadow: "0 0 40px rgba(34,211,238,0.3)" }}>
          RECON
        </h1>
        <p className="text-white/30 text-xs tracking-[0.15em] uppercase">Buying Group Intelligence</p>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="flex items-center gap-8 mb-12">
        {[
          { label: "Vendors", value: stats?.vendors_scraped ?? 0, icon: Eye },
          { label: "Contacts", value: stats?.contacts_unique ?? 0, icon: Users },
          { label: "Files", value: stats?.files_downloaded ?? 0, icon: FileText },
          { label: "Signals", value: stats?.signals_count ?? 0, icon: Activity },
        ].map((s) => (
          <div key={s.label} className="text-center group">
            <s.icon className="w-4 h-4 text-cyan-500/40 mx-auto mb-2 group-hover:text-cyan-400 transition-colors" />
            <div data-count={s.value} className="text-2xl font-mono font-bold tabular-nums bg-gradient-to-b from-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              {loading ? "—" : "0"}
            </div>
            <p className="text-[9px] text-white/25 uppercase tracking-[0.12em] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Buying Group Cards — Swiper Carousel */}
      <div className="w-full max-w-md">
        <Swiper
          modules={[EffectCards, Autoplay]}
          effect="cards"
          grabCursor
          autoplay={{ delay: 5000, disableOnInteraction: true }}
          className="w-72 mx-auto"
        >
          {/* GC Card */}
          <SwiperSlide>
            <button onClick={() => onSelectGroup("gc")} className="w-full text-left rounded-2xl overflow-hidden cursor-pointer group transition-transform active:scale-[0.97]"
              style={{ background: "linear-gradient(145deg, rgba(17,24,39,0.8) 0%, rgba(17,24,39,0.6) 100%)", backdropFilter: "blur(24px)", border: "1px solid rgba(34,211,238,0.12)" }}>
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 uppercase tracking-[0.1em] font-medium">Active</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-lg border border-cyan-500/20">GC</div>
                  <div>
                    <h3 className="text-white font-semibold text-base">GC Buying Group</h3>
                    <p className="text-white/30 text-[10px]">Gourmet Catalog</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-px bg-white/[0.03]">
                {[
                  { label: "Vendors", val: stats?.vendors_scraped ?? "—" },
                  { label: "Contacts", val: stats?.contacts_unique ?? "—" },
                  { label: "Files", val: stats?.files_downloaded ?? "—" },
                  { label: "Signals", val: stats?.signals_count ?? "—" },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.02] px-3 py-3 text-center">
                    <p className="text-[13px] font-mono font-bold tabular-nums text-white/70">{s.val}</p>
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.1em] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-6 py-3">
                <span className="text-[10px] text-white/20 font-mono">Scraped {timeAgo(stats?.scraped_at)}</span>
                <ChevronRight className="w-4 h-4 text-cyan-500/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </SwiperSlide>

          {/* HTI Placeholder */}
          <SwiperSlide>
            <div className="w-full rounded-2xl overflow-hidden" style={{ background: "rgba(17,24,39,0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/15 border border-white/[0.06] mb-4">
                  <Radar className="w-5 h-5" />
                </div>
                <p className="text-white/20 text-xs">More groups coming</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Refresh */}
      <button onClick={onRefresh} className="mt-8 flex items-center gap-2 text-[10px] text-white/20 hover:text-cyan-400 transition-colors">
        <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        Refresh intel
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  LEVEL 2 — Vendor Grid
// ════════════════════════════════════════════════════════════════════

interface VendorGridProps {
  data: NonNullable<ReturnType<typeof useRecon>["data"]>;
  onBack: () => void;
  onSelectVendor: (v: ReconVendor) => void;
  onRefresh: () => void;
}

function VendorGrid({ data, onBack, onSelectVendor, onRefresh }: VendorGridProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [filters, setFilters] = useState<Record<FilterKey, boolean>>({ hasDiscount: false, hasFiles: false, hasContacts: false, hasSignals: false });
  const [showChart, setShowChart] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const stats = data.stats;

  // Fuse.js fuzzy search
  const fuse = useMemo(() => new Fuse(data.vendors, { keys: ["name", "fields.line_description"], threshold: 0.3 }), [data.vendors]);

  const filtered = useMemo(() => {
    let list = search ? fuse.search(search).map(r => r.item) : [...data.vendors];
    if (filters.hasDiscount) list = list.filter(v => v.fields?.discount);
    if (filters.hasFiles) list = list.filter(v => v.file_count > 0);
    if (filters.hasContacts) list = list.filter(v => v.contact_count > 0);
    if (filters.hasSignals) list = list.filter(v => v.signals?.length > 0);

    list.sort((a, b) => {
      if (sort === "contacts") return b.contact_count - a.contact_count;
      if (sort === "files") return b.file_count - a.file_count;
      if (sort === "discount") return (b.fields?.discount ? 1 : 0) - (a.fields?.discount ? 1 : 0);
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [data.vendors, search, sort, filters, fuse]);

  // GSAP stagger entrance
  useGSAP(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".vendor-card");
    gsap.fromTo(cards, { opacity: 0, y: 16, scale: 0.96 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.03, ease: "power2.out",
    });
  }, { scope: gridRef, dependencies: [filtered.length, sort] });

  const toggleFilter = (key: FilterKey) => {
    const next = { ...filters, [key]: !filters[key] };
    setFilters(next);
    const active = Object.values(next).filter(Boolean).length;
    if (active > 0) getNotyf().open({ type: "info", message: `${filtered.length} vendor${filtered.length !== 1 ? "s" : ""} showing` });
  };

  // ApexCharts treemap data
  const treemapData = useMemo(() => data.vendors.filter(v => v.contact_count > 0).map(v => ({
    x: v.name.length > 18 ? v.name.slice(0, 16) + "…" : v.name,
    y: v.contact_count,
    fillColor: v.signals?.some(s => s.severity === "HIGH") ? "#EF4444" :
               v.signals?.length ? "#F59E0B" :
               v.fields?.discount ? "#10B981" : "#0E7490",
  })), [data.vendors]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="flex items-center gap-1 text-white/30 hover:text-cyan-400 transition-colors text-xs">
            <ChevronLeft className="w-4 h-4" /> RECON
          </button>
          <span className="text-white/10">/</span>
          <span className="text-white/60 text-xs font-medium">GC Buying Group</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm border border-cyan-500/20">GC</div>
            <div>
              <h2 className="text-white font-semibold text-lg">GC Buying Group</h2>
              <div className="flex items-center gap-3 mt-0.5">
                {[
                  { v: stats.vendors_scraped, l: "vendors" }, { v: stats.contacts_unique, l: "contacts" },
                  { v: stats.files_downloaded, l: "files" }, { v: stats.signals_count, l: "signals" },
                ].map(s => (
                  <span key={s.l} className="text-[10px] font-mono text-white/25"><strong className="text-white/40">{s.v}</strong> {s.l}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChart(v => !v)} className={cn("p-2 rounded-lg transition-colors", showChart ? "bg-cyan-500/10 text-cyan-400" : "text-white/20 hover:text-white/40 hover:bg-white/[0.03]")}>
              <Activity className="w-4 h-4" />
            </button>
            <button onClick={onRefresh} className="p-2 rounded-lg text-white/20 hover:text-cyan-400 hover:bg-white/[0.03] transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${data.vendors.length} vendors...`}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-xs placeholder:text-white/20 outline-none focus:border-cyan-500/30 focus:bg-white/[0.06] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(["hasDiscount", "hasFiles", "hasContacts", "hasSignals"] as FilterKey[]).map(f => (
              <button key={f} onClick={() => toggleFilter(f)} className={cn(
                "px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all border",
                filters[f]
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                  : "bg-white/[0.02] text-white/25 border-white/[0.04] hover:bg-white/[0.04] hover:text-white/40",
              )}>
                {f === "hasDiscount" ? "% Discount" : f === "hasFiles" ? "Files" : f === "hasContacts" ? "Contacts" : "Signals"}
              </button>
            ))}
          </div>

          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            className="px-2.5 py-1.5 rounded-md text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] text-white/40 outline-none cursor-pointer">
            <option value="name">Name A-Z</option>
            <option value="contacts">Most Contacts</option>
            <option value="files">Most Files</option>
            <option value="discount">Has Discount</option>
          </select>
        </div>
      </div>

      {/* Treemap Chart (toggleable) */}
      <AnimatePresence>
        {showChart && treemapData.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 200, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex-none px-6 overflow-hidden">
            <Suspense fallback={<div className="h-[200px] bg-white/[0.02] rounded-xl animate-pulse" />}>
              <Chart type="treemap" height={200} series={[{ data: treemapData }]}
                options={{
                  chart: { background: "transparent", toolbar: { show: false }, animations: { speed: 600 } },
                  theme: { mode: "dark" },
                  legend: { show: false },
                  plotOptions: { treemap: { distributed: true, enableShades: false } },
                  dataLabels: { style: { fontSize: "10px", fontFamily: "Inter", fontWeight: 500 } },
                  tooltip: {
                    theme: "dark",
                    y: { formatter: (v: number) => `${v} contacts` },
                  },
                }}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vendor Cards Grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {filtered.map(v => (
            <VendorCard key={v.name} vendor={v} onClick={() => onSelectVendor(v)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Search className="w-6 h-6 text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-xs">No vendors match your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vendor Card ──────────────────────────────────────────────────────

function VendorCard({ vendor: v, onClick }: { vendor: ReconVendor; onClick: () => void }) {
  const signals = v.signals || [];
  const highCount = signals.filter(s => s.severity === "HIGH").length;

  const tooltipContent = useMemo(() => {
    const parts: string[] = [];
    if (v.fields?.discount) parts.push(`Discount: ${v.fields.discount}`);
    if (v.fields?.opening_order) parts.push(`Min order: ${v.fields.opening_order}`);
    if (v.fields?.terms) parts.push(`Terms: ${v.fields.terms}`);
    if (v.fields?.line_description) parts.push(v.fields.line_description.slice(0, 80) + "…");
    return parts.join("\n") || v.name;
  }, [v]);

  return (
    <Tippy content={<div className="text-[10px] whitespace-pre-line max-w-[240px]">{tooltipContent}</div>}
      placement="top" delay={[400, 0]} theme="dark" animation="shift-toward">
      <button onClick={onClick}
        className="vendor-card w-full text-left rounded-xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{ background: "rgba(17,24,39,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/[0.06] flex items-center justify-center text-cyan-400/60 font-bold text-[11px] border border-cyan-500/10 group-hover:border-cyan-500/25 transition-colors">
              {initials(v.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white/80 text-[13px] font-medium truncate group-hover:text-white transition-colors">{v.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                {v.contact_count > 0 && <span className="text-[9px] font-mono text-white/20">{v.contact_count} contacts</span>}
                {v.file_count > 0 && <span className="text-[9px] font-mono text-white/20">{v.file_count} files</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          {signals.length > 0 && (
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1",
              highCount > 0 ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
              <Zap className="w-2.5 h-2.5" /> {signals.length} signal{signals.length !== 1 ? "s" : ""}
            </span>
          )}
          {v.fields?.discount && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium truncate max-w-[140px]">
              % {v.fields.discount.length > 18 ? v.fields.discount.slice(0, 16) + "…" : v.fields.discount}
            </span>
          )}
          {v.fields?.opening_order && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25 font-medium">
              Min {v.fields.opening_order}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-t border-white/[0.04]">
          <span className="text-[9px] font-mono text-white/15">{v.email_count} email{v.email_count !== 1 ? "s" : ""}</span>
          <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-cyan-400/50 group-hover:translate-x-0.5 transition-all" />
        </div>
      </button>
    </Tippy>
  );
}

// ════════════════════════════════════════════════════════════════════
//  LEVEL 3 — Vendor Drawer (slide from right, Lenis smooth scroll)
// ════════════════════════════════════════════════════════════════════

function VendorDrawer({ vendor: v, onClose }: { vendor: ReconVendor; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    about: true, terms: true, contacts: true, documents: false, signals: true,
  });

  // Lenis smooth scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    let lenis: any;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ wrapper: scrollRef.current!, content: scrollRef.current!.firstElementChild as HTMLElement, smoothWheel: true, lerp: 0.1 });
      function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    });
    return () => { lenis?.destroy(); };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    getNotyf().success(`Copied: ${text}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSection = (key: string) => setExpandedSections(s => ({ ...s, [key]: !s[key] }));

  // Group contacts by role
  const roleGroups = useMemo(() => {
    const groups: Record<string, VendorContact[]> = {};
    (v.contacts || []).forEach(c => {
      const r = c.role || "general";
      (groups[r] ??= []).push(c);
    });
    return groups;
  }, [v.contacts]);

  // Categorize files
  const fileCategories = useMemo(() => {
    const cats: Record<string, typeof v.files> = { "Catalogs": [], "Price Lists": [], "Order Forms": [], "Other": [] };
    (v.files || []).forEach(f => {
      const name = (f.file || f.text || "").toLowerCase();
      if (/catalog|new.arrival|marketing|lookbook/i.test(name)) cats["Catalogs"].push(f);
      else if (/price/i.test(name)) cats["Price Lists"].push(f);
      else if (/order|form/i.test(name)) cats["Order Forms"].push(f);
      else cats["Other"].push(f);
    });
    return Object.entries(cats).filter(([, files]) => files.length > 0);
  }, [v.files]);

  const website = v.fields?.website || "";
  const signals = v.signals || [];

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg"
        style={{ background: "linear-gradient(180deg, #0F172A 0%, #0B1120 100%)", borderLeft: "1px solid rgba(34,211,238,0.08)" }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="px-6 pt-6 pb-12">
            {/* Hero */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-xl border border-cyan-500/20">
                  {initials(v.name)}
                </div>
                <div>
                  <h2 className="text-white font-semibold text-xl">{v.name}</h2>
                  {website && (
                    <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener"
                      className="text-[11px] font-mono text-cyan-400/60 hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
                      {website} <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { icon: Users, val: v.contact_count, label: "Contacts" },
                  { icon: FileText, val: v.file_count, label: "Files" },
                  { icon: Mail, val: v.email_count, label: "Emails" },
                  { icon: Phone, val: (v.all_phones || []).length, label: "Phones" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5 text-center">
                    <s.icon className="w-3.5 h-3.5 text-cyan-500/30 mx-auto mb-1" />
                    <p className="text-[15px] font-mono font-bold text-white/70 tabular-nums">{s.val}</p>
                    <p className="text-[8px] text-white/20 uppercase tracking-[0.1em]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Terms banner */}
              {(v.fields?.discount || v.fields?.opening_order || v.fields?.minimum_reorder) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {v.fields.discount && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-[10px] text-emerald-400 font-medium">
                      <Tag className="w-3 h-3 inline mr-1" />{v.fields.discount}
                    </span>
                  )}
                  {v.fields.opening_order && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40">
                      Opening: {v.fields.opening_order}
                    </span>
                  )}
                  {v.fields.minimum_reorder && (
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-white/40">
                      Min reorder: {v.fields.minimum_reorder}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── ABOUT ── */}
            {v.fields?.line_description && (
              <DrawerSection title="About" icon={Globe} expanded={expandedSections.about} onToggle={() => toggleSection("about")}>
                <p className="text-[11px] text-white/40 leading-relaxed">{v.fields.line_description}</p>
              </DrawerSection>
            )}

            {/* ── TERMS ── */}
            {(() => {
              const termKeys = ["terms", "fob", "back_order_policy", "payments_accepted"];
              const hasTerms = termKeys.some(k => v.fields?.[k]);
              if (!hasTerms) return null;
              return (
                <DrawerSection title="Terms & Policies" icon={FileText} expanded={expandedSections.terms} onToggle={() => toggleSection("terms")}>
                  <div className="grid grid-cols-2 gap-2">
                    {termKeys.map(k => {
                      if (!v.fields?.[k]) return null;
                      return (
                        <div key={k} className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                          <p className="text-[9px] text-white/20 uppercase tracking-[0.06em] mb-0.5">{k.replace(/_/g, " ")}</p>
                          <p className="text-[11px] text-white/50">{v.fields[k]}</p>
                        </div>
                      );
                    })}
                  </div>
                </DrawerSection>
              );
            })()}

            {/* ── CONTACTS ── */}
            {Object.keys(roleGroups).length > 0 && (
              <DrawerSection title="Contacts" icon={Users} count={v.contact_count} expanded={expandedSections.contacts} onToggle={() => toggleSection("contacts")}>
                {Object.entries(roleGroups).map(([role, contacts]) => (
                  <div key={role} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] text-cyan-400/50 uppercase tracking-[0.08em] font-medium">{roleLabel(role)}</span>
                      <span className="text-[9px] text-white/15 font-mono">{contacts.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      {contacts.map((c, i) => (
                        <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
                          <p className="text-[11px] text-white/60 font-medium mb-1">{c.name || "N/A"}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.emails?.map(em => (
                              <Tippy key={em} content={copied === em ? "Copied!" : "Click to copy"} placement="top">
                                <button onClick={() => copyToClipboard(em)} className="text-[10px] font-mono text-cyan-400/50 hover:text-cyan-400 inline-flex items-center gap-1 transition-colors">
                                  <Mail className="w-2.5 h-2.5" /> {em}
                                  {copied === em ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 opacity-30" />}
                                </button>
                              </Tippy>
                            ))}
                            {c.phones?.map(ph => (
                              <Tippy key={ph} content={copied === ph ? "Copied!" : "Click to copy"} placement="top">
                                <button onClick={() => copyToClipboard(ph)} className="text-[10px] font-mono text-white/25 hover:text-white/50 inline-flex items-center gap-1 transition-colors">
                                  <Phone className="w-2.5 h-2.5" /> {ph}
                                </button>
                              </Tippy>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </DrawerSection>
            )}

            {/* ── DOCUMENTS ── */}
            {fileCategories.length > 0 && (
              <DrawerSection title="Documents" icon={FileText} count={v.file_count} expanded={expandedSections.documents} onToggle={() => toggleSection("documents")}>
                {fileCategories.map(([cat, files]) => (
                  <div key={cat} className="mb-3 last:mb-0">
                    <p className="text-[9px] text-white/20 uppercase tracking-[0.06em] mb-1.5">{cat} ({files.length})</p>
                    <div className="space-y-1">
                      {files.map((f, i) => {
                        const name = f.file || f.text || "Unknown";
                        const ext = name.split(".").pop()?.toUpperCase() || "";
                        return (
                          <a key={i} href={f.url || "#"} target="_blank" rel="noopener"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
                            <FileText className={cn("w-3.5 h-3.5 flex-none", fileIcon(name))} />
                            <span className="text-[11px] text-white/50 truncate flex-1 group-hover:text-white/70">{name}</span>
                            <span className="text-[9px] font-mono text-white/15 flex-none">{ext}</span>
                            <Download className="w-3 h-3 text-white/10 group-hover:text-cyan-400/50 flex-none" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </DrawerSection>
            )}

            {/* ── SIGNALS ── */}
            {signals.length > 0 && (
              <DrawerSection title="Signals" icon={Activity} count={signals.length} expanded={expandedSections.signals} onToggle={() => toggleSection("signals")}>
                <div className="space-y-2">
                  {signals.map((sig, i) => {
                    const sev = SEVERITY_COLORS[sig.severity] || SEVERITY_COLORS.LOW;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                        <div className="px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-none", sev.dot)} />
                            <span className={cn("text-[9px] font-bold uppercase tracking-[0.08em]", sev.text)}>{sig.severity}</span>
                            <span className="text-[9px] text-white/20">{(sig.type || "").replace(/_/g, " ")}</span>
                            {sig.detected_at && <span className="text-[9px] font-mono text-white/15 ml-auto">{sig.detected_at}</span>}
                          </div>
                          <p className="text-[11px] text-white/40">{sig.message}</p>
                        </div>
                        {/* Diff */}
                        {sig.details?.diff_lines && sig.details.diff_lines.length > 0 && (
                          <div className="px-3 py-2 bg-white/[0.01] border-t border-white/[0.03]">
                            <pre className="text-[9px] font-mono leading-relaxed overflow-x-auto">
                              {sig.details.diff_lines.slice(0, 20).map((line, li) => (
                                <span key={li} className={cn(
                                  line.startsWith("+") ? "text-emerald-400/70" :
                                  line.startsWith("-") ? "text-red-400/70" :
                                  line.startsWith("@") ? "text-cyan-400/40" : "text-white/20",
                                )}>{line}{"\n"}</span>
                              ))}
                            </pre>
                          </div>
                        )}
                        {/* Field change */}
                        {sig.details?.old_value !== undefined && sig.details?.new_value !== undefined && (
                          <div className="px-3 py-2 bg-white/[0.01] border-t border-white/[0.03] flex items-center gap-2 text-[10px]">
                            <span className="text-red-400/60 line-through font-mono">{sig.details.old_value}</span>
                            <ChevronRight className="w-3 h-3 text-white/15" />
                            <span className="text-emerald-400/70 font-mono">{sig.details.new_value}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </DrawerSection>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-white/[0.04] text-center">
              <p className="text-[9px] font-mono text-white/15">
                Scraped {v.scraped_at ? new Date(v.scraped_at).toLocaleString() : "unknown"}
              </p>
              {v.content_hash && (
                <p className="text-[9px] font-mono text-white/10 mt-1">
                  <Hash className="w-2.5 h-2.5 inline" /> {v.content_hash.slice(0, 12)}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Drawer Section (accordion) ───────────────────────────────────────

function DrawerSection({ title, icon: Icon, count, expanded, onToggle, children }: {
  title: string; icon: typeof Users; count?: number; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <button onClick={onToggle} className="w-full flex items-center gap-2 py-2 text-left group">
        <Icon className="w-3.5 h-3.5 text-cyan-500/40" />
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.06em] group-hover:text-white/70 transition-colors">{title}</span>
        {count !== undefined && <span className="text-[9px] font-mono text-white/15">{count}</span>}
        <span className="ml-auto">
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/15" /> : <ChevronDown className="w-3.5 h-3.5 text-white/15" />}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReconView;
