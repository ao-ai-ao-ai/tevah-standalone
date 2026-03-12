import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, FileText, FileSpreadsheet, Receipt, Truck, Package, Mail, File, Filter, CheckCircle2 } from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { DEALS_BY_NUMBER, type DocumentRef } from "../data/deal-intelligence";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";

// Document types we derive from deal data + email intelligence
type DocType = "offer_sheet" | "purchase_order" | "customer_invoice" | "vendor_invoice" | "packing_list" | "bol" | "email" | "payment";

interface DocumentEntry {
  id: string;
  dealNumber: string;
  type: DocType;
  title: string;
  counterparty: string;
  brand: string;
  amount?: number;
  date: string;
  stage: string;
  isReal?: boolean;
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; icon: typeof FileText; cls: string }> = {
  offer_sheet: { label: "Offer Sheet", icon: FileSpreadsheet, cls: "text-blue-700 bg-blue-50" },
  purchase_order: { label: "Purchase Order", icon: FileText, cls: "text-purple-700 bg-purple-50" },
  customer_invoice: { label: "Customer Invoice", icon: Receipt, cls: "text-emerald-700 bg-emerald-50" },
  vendor_invoice: { label: "Vendor Invoice", icon: Receipt, cls: "text-amber-700 bg-amber-50" },
  packing_list: { label: "Packing List", icon: Package, cls: "text-indigo-700 bg-indigo-50" },
  bol: { label: "Bill of Lading", icon: Truck, cls: "text-sky-700 bg-sky-50" },
  email: { label: "Email", icon: Mail, cls: "text-text-secondary bg-canvas" },
  payment: { label: "Payment", icon: File, cls: "text-green-700 bg-green-50" },
};

/** Map DocumentRef.type to our DocType */
function mapDocRefType(ref: DocumentRef, deal: { vendor: string }): DocType {
  switch (ref.type) {
    case 'offer_sheet': return 'offer_sheet';
    case 'invoice': return ref.from === deal.vendor ? 'vendor_invoice' : 'customer_invoice';
    case 'packing_list': return 'packing_list';
    case 'po': return 'purchase_order';
    case 'bol': return 'bol';
    case 'email': return 'email';
    default: return 'email';
  }
}

/** Format ISO date string to short readable date */
function formatDocDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function deriveDocuments(): DocumentEntry[] {
  const docs: DocumentEntry[] = [];

  for (const deal of ALL_DEALS) {
    const stage = deal.stage;

    // Every deal with offers stage has an offer sheet
    if (["Not sent yet", "waiting for specs", "Need Confirmation", "Negotiation", "Confirmed"].includes(stage) || deal.sellTotal > 0) {
      docs.push({
        id: `doc-${deal.id}-offer`,
        dealNumber: deal.dealNumber,
        type: "offer_sheet",
        title: `${deal.brand} Offer #${deal.dealNumber}`,
        counterparty: deal.vendor,
        brand: deal.brand,
        amount: deal.sellTotal,
        date: deal.date || "",
        stage,
      });
    }

    // Confirmed+ deals have a PO
    if (["Confirmed", "Logistics", "Invoiced", "Won", "won- need payment"].includes(stage)) {
      docs.push({
        id: `doc-${deal.id}-po`,
        dealNumber: deal.dealNumber,
        type: "purchase_order",
        title: `VPO #${deal.dealNumber} - ${deal.brand}`,
        counterparty: deal.vendor,
        brand: deal.brand,
        amount: deal.buyTotal,
        date: deal.date || "",
        stage,
      });
    }

    // Invoiced/Won deals have customer invoice
    if (["Invoiced", "Won", "won- need payment"].includes(stage) && deal.sellTotal > 0) {
      docs.push({
        id: `doc-${deal.id}-cinv`,
        dealNumber: deal.dealNumber,
        type: "customer_invoice",
        title: `Invoice to ${deal.customer} #${deal.dealNumber}`,
        counterparty: deal.customer,
        brand: deal.brand,
        amount: deal.sellTotal,
        date: deal.date || "",
        stage,
      });
    }

    // Logistics+ deals have packing list and BOL
    if (["Logistics", "Invoiced", "Won", "won- need payment"].includes(stage)) {
      docs.push({
        id: `doc-${deal.id}-pl`,
        dealNumber: deal.dealNumber,
        type: "packing_list",
        title: `Packing List #${deal.dealNumber} - ${deal.brand}`,
        counterparty: deal.vendor,
        brand: deal.brand,
        date: deal.date || "",
        stage,
      });
      docs.push({
        id: `doc-${deal.id}-bol`,
        dealNumber: deal.dealNumber,
        type: "bol",
        title: `BOL #${deal.dealNumber}`,
        counterparty: deal.vendor,
        brand: deal.brand,
        date: deal.date || "",
        stage,
      });
    }

    // Payment received deals
    if (deal.payment === "Received" && deal.sellTotal > 0) {
      docs.push({
        id: `doc-${deal.id}-pmt`,
        dealNumber: deal.dealNumber,
        type: "payment",
        title: `Payment from ${deal.customer} #${deal.dealNumber}`,
        counterparty: deal.customer,
        brand: deal.brand,
        amount: deal.sellTotal,
        date: deal.date || "",
        stage,
      });
    }
  }

  // Second pass: add real documents from deal-intelligence
  const realDocKeys = new Set<string>(); // track deal+type combos covered by real docs
  const realDocs: DocumentEntry[] = [];

  for (const deal of ALL_DEALS) {
    const enhanced = DEALS_BY_NUMBER[deal.dealNumber];
    if (!enhanced?.documents?.length) continue;

    for (let idx = 0; idx < enhanced.documents.length; idx++) {
      const ref = enhanced.documents[idx];
      const mappedType = mapDocRefType(ref, deal);
      const key = `${deal.dealNumber}:${mappedType}`;
      realDocKeys.add(key);

      realDocs.push({
        id: `doc-${deal.id}-real-${idx}`,
        dealNumber: deal.dealNumber,
        type: mappedType,
        title: ref.filename || ref.subject || `${ref.type} - ${deal.brand}`,
        counterparty: ref.from || deal.vendor,
        brand: deal.brand,
        amount: ref.amount,
        date: ref.date ? formatDocDate(ref.date) : (deal.date || ""),
        stage: deal.stage,
        isReal: true,
      });
    }
  }

  // De-duplicate: remove fabricated docs where a real doc covers the same deal+type
  const deduped = docs.filter(d => !realDocKeys.has(`${d.dealNumber}:${d.type}`));

  // Combine: real docs first (higher priority), then remaining fabricated docs
  const combined = [...realDocs, ...deduped];

  return combined.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

type Tab = DocType | "all";

export function DocumentsView() {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");

  const allDocs = useMemo(() => deriveDocuments(), []);

  const realCount = useMemo(() => allDocs.filter(d => d.isReal).length, [allDocs]);

  const filtered = useMemo(() => {
    let list = allDocs;
    if (tab !== "all") list = list.filter(d => d.type === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.dealNumber.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.counterparty.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allDocs, tab, search]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of allDocs) {
      counts[d.type] = (counts[d.type] || 0) + 1;
    }
    return counts;
  }, [allDocs]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em]">Documents</h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {allDocs.length} documents across {ALL_DEALS.length} deals
              <span className="inline-flex items-center gap-1 ml-2 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                {realCount} verified
              </span>
              {filtered.length !== allDocs.length && <span className="text-purple-600 ml-1">({filtered.length} shown)</span>}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..."
              className="h-8 pl-8 pr-3 w-56 text-xs bg-white border border-divider rounded-md text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200" />
          </div>
        </div>

        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              tab === "all" ? "bg-purple-100 text-purple-700" : "text-text-tertiary hover:text-text-secondary hover:bg-white"
            )}>
            All <span className={cn("ml-1 text-[10px] tabular-nums", tab === "all" ? "text-purple-500" : "text-text-disabled")}>{allDocs.length}</span>
          </button>
          {(Object.keys(DOC_TYPE_CONFIG) as DocType[]).map(type => {
            const count = typeCounts[type] || 0;
            if (count === 0) return null;
            const config = DOC_TYPE_CONFIG[type];
            return (
              <button key={type} onClick={() => setTab(type)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center gap-1",
                  tab === type ? "bg-purple-100 text-purple-700" : "text-text-tertiary hover:text-text-secondary hover:bg-white"
                )}>
                <config.icon className="w-3 h-3" />
                {config.label}
                <span className={cn("text-[10px] tabular-nums", tab === type ? "text-purple-500" : "text-text-disabled")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Card variant="standard" className="mx-4 mt-4 mb-4 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-divider">
                {["Type", "Title", "Deal #", "Counterparty", "Brand", "Amount", "Date"].map(h => (
                  <th key={h} className="text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-text-tertiary text-sm">No documents match your filters.</td></tr>
              )}
              {filtered.slice(0, 200).map((doc, i) => {
                const config = DOC_TYPE_CONFIG[doc.type];
                return (
                  <motion.tr key={doc.id}
                    initial={i < 40 ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.006, 0.25) }}
                    className="border-b border-divider hover:bg-hover cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5">
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", config.cls)}>
                        <config.icon className="w-2.5 h-2.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-text-primary font-medium truncate max-w-[260px]">
                      <span className="inline-flex items-center gap-1.5">
                        {doc.title}
                        {doc.isReal && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-px rounded bg-emerald-50 text-emerald-600 text-[9px] font-medium whitespace-nowrap flex-shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-text-secondary">#{doc.dealNumber}</td>
                    <td className="px-3 py-2.5 text-text-secondary truncate max-w-[160px]">{doc.counterparty}</td>
                    <td className="px-3 py-2.5 text-text-tertiary truncate max-w-[120px]">{doc.brand}</td>
                    <td className="px-3 py-2.5 font-mono text-text-primary tabular-nums">{doc.amount ? formatCurrency(doc.amount) : "--"}</td>
                    <td className="px-3 py-2.5 text-text-tertiary whitespace-nowrap">{doc.date || "--"}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

export default DocumentsView;
