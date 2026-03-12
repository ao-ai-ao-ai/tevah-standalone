/**
 * TEVAH EMAIL DATA + STAGE PIPELINE
 * =================================
 * Emails: 7 real-world email patterns with actual brands/customers.
 * Stage Pipeline: B1-B15 Leviathan v2 mapped from Monday stages.
 *
 * Orders/Customers/Vendors are in monday.ts (all 500 deals).
 */

import type { MondayDeal } from "./monday";

export type SplitTab = "all" | "orders" | "quotes" | "suppliers" | "shipping" | "payments";
export type ThreeWayScenario = "MATCH" | "PREMIUM" | "DISCOUNT_OK" | "DISCOUNT_BELOW" | "LOSS";

export interface Email {
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
  isArchived: boolean;
  isStarred: boolean;
  category: SplitTab;
  urgency: "urgent" | "high" | "medium" | "low";
  aiCategory: string;
  aiSummary: string;
  attachments: string[];
  threadCount: number;
  hasOrder: boolean;
  linkedOrderNumber?: string;
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
  customer?: CustomerProfile;
}

export interface CustomerProfile {
  name: string;
  tier: string;
  healthScore: number;
  avgOrder: number;
  frequency: string;
  openOrders: number;
  paymentTerms: string;
  lastContact: string;
  totalRevenue: number;
}

// ============================================================================
// STAGE PIPELINE — B1-B15 Leviathan v2 mapped from Monday stages
// ============================================================================

export type StageGroup = "DEAL" | "LOCK" | "MOVE" | "CHECK" | "CLOSE" | "LOST" | "PROBLEM";

export const STAGE_GROUP_COLORS: Record<StageGroup, { text: string; bg: string; border: string }> = {
  DEAL: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  LOCK: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  MOVE: { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  CHECK: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  CLOSE: { text: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  LOST: { text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
  PROBLEM: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

export const STAGE_PIPELINE: Array<{
  code: string;
  name: string;
  group: StageGroup;
  mondayStages: string[];
  color: string;
  bgColor: string;
}> = [
  // DEAL — Customer wants something, find source, agree on price
  { code: "D1", name: "Intake", group: "DEAL", mondayStages: ["Not sent yet"], color: "text-blue-600", bgColor: "bg-blue-50" },
  { code: "D2", name: "Sourcing", group: "DEAL", mondayStages: ["waiting for specs"], color: "text-blue-600", bgColor: "bg-blue-50" },
  { code: "D3", name: "Negotiation", group: "DEAL", mondayStages: ["Negotiation"], color: "text-blue-600", bgColor: "bg-blue-50" },
  // LOCK — Money down, Buy sent, awaiting confirmation
  { code: "L1", name: "Deposit", group: "LOCK", mondayStages: ["won- need payment"], color: "text-amber-600", bgColor: "bg-amber-50" },
  { code: "L2", name: "Buying", group: "LOCK", mondayStages: [], color: "text-amber-600", bgColor: "bg-amber-50" },
  { code: "L3", name: "Pending Confirm", group: "LOCK", mondayStages: ["Need Confirmation"], color: "text-amber-600", bgColor: "bg-amber-50" },
  // MOVE — Vendor confirmed, paid, shipping
  { code: "M1", name: "Confirmed", group: "MOVE", mondayStages: ["Confirmed"], color: "text-violet-600", bgColor: "bg-violet-50" },
  { code: "M2", name: "Pay Vendor", group: "MOVE", mondayStages: [], color: "text-violet-600", bgColor: "bg-violet-50" },
  { code: "M3", name: "In Transit", group: "MOVE", mondayStages: ["Logistics"], color: "text-violet-600", bgColor: "bg-violet-50" },
  // CHECK — Goods arrive, QC, ready to ship
  { code: "C1", name: "Receiving", group: "CHECK", mondayStages: [], color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { code: "C2", name: "Checking", group: "CHECK", mondayStages: [], color: "text-emerald-600", bgColor: "bg-emerald-50" },
  { code: "C3", name: "Verified", group: "CHECK", mondayStages: [], color: "text-emerald-600", bgColor: "bg-emerald-50" },
  // CLOSE — Ship, bill, done
  { code: "X1", name: "Pack & Ship", group: "CLOSE", mondayStages: [], color: "text-green-600", bgColor: "bg-green-50" },
  { code: "X2", name: "Invoice", group: "CLOSE", mondayStages: ["Invoiced"], color: "text-green-600", bgColor: "bg-green-50" },
  { code: "X3", name: "Delivered", group: "CLOSE", mondayStages: ["Won"], color: "text-green-600", bgColor: "bg-green-50" },
  // Terminal
  { code: "LOST", name: "Lost", group: "LOST", mondayStages: ["Lost"], color: "text-gray-500", bgColor: "bg-gray-50" },
  { code: "PROB", name: "Problem", group: "PROBLEM", mondayStages: ["Problem"], color: "text-red-600", bgColor: "bg-red-50" },
];

// ============================================================================
// HELPERS — Monday stage → B-code mapping
// ============================================================================

export function mondayStageToCode(stage: string): string {
  const match = STAGE_PIPELINE.find(s => s.mondayStages.includes(stage));
  return match?.code || "B1";
}

export function mondayStageToPipeline(stage: string) {
  return STAGE_PIPELINE.find(s => s.mondayStages.includes(stage)) || STAGE_PIPELINE[0];
}

export function getDaysInStage(deal: MondayDeal): number {
  if (!deal.date) return 0;
  const dealDate = new Date(deal.date);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - dealDate.getTime()) / (86400000)));
}

export function isSlaBreached(deal: MondayDeal): boolean {
  if (["Won", "Lost"].includes(deal.stage)) return false;
  const days = getDaysInStage(deal);
  // Stages with naturally longer timelines get higher thresholds
  const longStages = ["Negotiation", "waiting for specs", "Not sent yet", "Confirmed", "Logistics"];
  const threshold = longStages.includes(deal.stage) ? 90 : 45;
  return days > threshold;
}

// ============================================================================
// EMAILS — Real-world Tevah email patterns
// ============================================================================

export const EMAILS: Email[] = [
  {
    id: "1",
    from: "Carlos Mendez",
    fromEmail: "carlos@comexsport.com",
    company: "Comexsport",
    subject: "RE: Adidas Samba — Order #6655 spec sheets needed",
    preview: "Gil, we need the updated spec sheets for the Samba lot before we can clear payment...",
    body: `Gil,\n\nWe need the updated spec sheets for the Samba lot before we can clear the remaining payment. The customs broker in Panama requires:\n\n1. Updated packing list with exact quantities per size\n2. Certificate of authenticity from Adidas\n3. Commercial invoice matching the PO\n\nWe've sent partial payment ($367K) but the balance is held until docs arrive.\n\nThis is a $735K deal — let's not let paperwork slow it down.\n\nCarlos Mendez\nComexsport S.A.`,
    time: "2:34 PM", timeAgo: "12m", isUnread: true, isArchived: false, isStarred: false,
    category: "orders", urgency: "urgent", aiCategory: "Documentation Required",
    aiSummary: "URGENT: Comexsport needs spec sheets for $735K Adidas Samba deal (#6655). Partial payment received ($367K), balance held pending docs. Customs broker blocking.",
    attachments: ["PO-6655-Samba.pdf"],
    threadCount: 6,
    hasOrder: true,
    linkedOrderNumber: "6655",
    extraction: {
      items: [{ product: "Adidas Samba (Mixed Sizes)", qty: 1, price: 734904, status: "Awaiting Specs" }],
      total: 734904,
      shipBy: "Pending",
      confidence: 0.92,
    },
    threeWay: { vendorCost: 647055, ourOffer: 690000, customerAsk: 734904, scenario: "PREMIUM", margin: 12.0 },
    customer: { name: "Comexsport", tier: "Gold", healthScore: 45, avgOrder: 57300, frequency: "1/mo", openOrders: 5, paymentTerms: "Net 45", lastContact: "Today", totalRevenue: 858997 },
  },
  {
    id: "2",
    from: "Matan Levy",
    fromEmail: "matan@interlightind.com",
    company: "Interlight / Cometa",
    subject: "Samsonite order #6677 — waiting on your pricing",
    preview: "Gil, the Samsonite lot is still waiting for specs. Matan from Amen Global says...",
    body: `Gil,\n\nThe Samsonite lot (#6677) is still waiting for specs from Amen Global.\n\nMatan says he can get us:\n- 2,000x Samsonite Freeform 24" Spinner — $87/ea\n- 1,500x Samsonite Omni PC 20" Spinner — $62/ea\n\nWe need your offer price to confirm. Our margin target is 10%+ on this.\n\nAlso — the Stokke reorder is ready whenever you confirm quantities.\n\nRegards,\nMatan Levy\nInterlight Industries / Cometa`,
    time: "1:15 PM", timeAgo: "1h", isUnread: true, isArchived: false, isStarred: false,
    category: "quotes", urgency: "high", aiCategory: "Pricing Request",
    aiSummary: "Interlight needs pricing on $144K Samsonite lot (#6677). Vendor (Amen Global) has specs ready. Also mentions Stokke reorder opportunity.",
    attachments: [],
    threadCount: 3,
    hasOrder: true,
    linkedOrderNumber: "6677",
    threeWay: { vendorCost: 130056, ourOffer: 137000, customerAsk: 144177, scenario: "DISCOUNT_OK", margin: 8.2 },
    customer: { name: "Interlight / Cometa", tier: "Platinum", healthScore: 85, avgOrder: 34300, frequency: "8/mo", openOrders: 68, paymentTerms: "Net 30", lastContact: "Today", totalRevenue: 10113435 },
  },
  {
    id: "3",
    from: "Nr-united Logistics",
    fromEmail: "shipping@nr-united.com",
    company: "Nr-united (Vendor)",
    subject: "RE: Giro order #6594 — Fulfillment update",
    preview: "The Giro helmets are staged for pickup. We need routing instructions...",
    body: `Dear Tevah,\n\nOrder #6594 (Giro helmets) is staged at our warehouse and ready for pickup.\n\nWe need routing instructions:\n- Ship direct to Interlight in Panama?\n- Or route through your Miami 3PL?\n\nNote: This order has been awaiting fulfillment for 62 days. Please advise urgently.\n\nShipping Department\nNr-united`,
    time: "11:42 AM", timeAgo: "3h", isUnread: false, isArchived: false, isStarred: true,
    category: "suppliers", urgency: "high", aiCategory: "Fulfillment Action Required",
    aiSummary: "Giro order #6594 ($122K) staged 62 days — SLA BREACHED. Nr-united needs routing: direct to Panama or via Miami 3PL. Overdue payment.",
    attachments: ["Giro-6594-PackingList.pdf"],
    threadCount: 8,
    hasOrder: true,
    linkedOrderNumber: "6594",
  },
  {
    id: "4",
    from: "David Chen",
    fromEmail: "david@duffl.com",
    company: "Duffl",
    subject: "John Boos #6661 — Invoice overdue, where's the tracking?",
    preview: "Gil, we invoiced this 41 days ago and still no delivery confirmation...",
    body: `Gil,\n\nOrder #6661 (John Boos) was invoiced on Jan 20 and we still have no tracking number or delivery ETA.\n\nThis is 41 days since invoice. Our payment is overdue because we haven't received the goods.\n\nCan you please:\n1. Confirm shipment status with Inventorypartnersales\n2. Provide tracking number\n3. Revised ETA\n\nWe have 3 more orders in the pipeline with you, but delays like this make it hard to commit.\n\nDavid Chen\nProcurement\nDuffl`,
    time: "10:05 AM", timeAgo: "4h", isUnread: true, isArchived: false, isStarred: false,
    category: "orders", urgency: "urgent", aiCategory: "Complaint — Delivery Delay",
    aiSummary: "URGENT: Duffl complaining about John Boos order #6661 ($192K). 41 days since invoice, no tracking. Threatens to hold pipeline orders. Payment overdue.",
    attachments: [],
    threadCount: 2,
    hasOrder: true,
    linkedOrderNumber: "6661",
    customer: { name: "Duffl", tier: "Gold", healthScore: 78, avgOrder: 38100, frequency: "3/mo", openOrders: 8, paymentTerms: "Net 15", lastContact: "Today", totalRevenue: 1372298 },
  },
  {
    id: "5",
    from: "Steven Dann",
    fromEmail: "steven@stevendann.com",
    company: "Steven Dann",
    subject: "Payment update — Diptyque #6395",
    preview: "Gil, I know the Diptyque invoice is overdue. Here's where we stand...",
    body: `Gil,\n\nI know the Diptyque invoice (#6395 — $120,512) is overdue. Here's the situation:\n\nWe sold through about 70% of the lot already. Cash flow is tight because our holiday collection payments came in late.\n\nI can do $60K this week and the balance by March 15.\n\nI've been a loyal customer — 9 deals, $261K+ total. Please work with me on this.\n\nSteven Dann`,
    time: "9:30 AM", timeAgo: "5h", isUnread: false, isArchived: false, isStarred: false,
    category: "payments", urgency: "high", aiCategory: "Payment Negotiation",
    aiSummary: "Steven Dann requesting payment plan for $120K Diptyque invoice (#6395). Offering $60K now + balance by Mar 15. 103 days overdue. Loyalty appeal (9 deals, $261K lifetime).",
    attachments: [],
    threadCount: 4,
    hasOrder: true,
    linkedOrderNumber: "6395",
    customer: { name: "Steven Dann", tier: "Bronze", healthScore: 52, avgOrder: 29000, frequency: "1/mo", openOrders: 5, paymentTerms: "Net 45", lastContact: "Today", totalRevenue: 261589 },
  },
  {
    id: "6",
    from: "House Buying Dept",
    fromEmail: "buying@house.com",
    company: "House",
    subject: "New inquiry — Le Creuset Holiday 2026",
    preview: "We're planning our holiday lineup and interested in Le Creuset through Tevah...",
    body: `Hi Gil,\n\nWe're planning our 2026 holiday season and interested in Le Creuset through your Central Gifts Center connection.\n\nLooking at:\n1. Dutch Ovens (5.5qt, 7.25qt) — 500 units\n2. Skillets (10.25", 11.75") — 300 units\n3. Bakeware Sets — 200 units\n\nNeed wholesale pricing and lead times. Our holiday window is Sept-Nov delivery.\n\nWe've done 52 deals with you for $635K — hoping for volume pricing.\n\nHouse Buying Department`,
    time: "Yesterday", timeAgo: "1d", isUnread: false, isArchived: false, isStarred: true,
    category: "quotes", urgency: "medium", aiCategory: "Quote Request — Existing Customer",
    aiSummary: "House requesting Le Creuset holiday 2026 pricing. 1,000 units across 3 categories. $635K lifetime customer with 52 deals. Volume pricing expected.",
    attachments: ["House-Holiday-Requirements.xlsx"],
    threadCount: 1,
    hasOrder: false,
    extraction: {
      items: [
        { product: "Le Creuset Dutch Ovens", qty: 500, price: 185, status: "Check Availability" },
        { product: "Le Creuset Skillets", qty: 300, price: 140, status: "Check Availability" },
        { product: "Le Creuset Bakeware Sets", qty: 200, price: 95, status: "Check Availability" },
      ],
      total: 153500,
      shipBy: "September 2026",
      confidence: 0.88,
    },
    threeWay: { vendorCost: 98000, ourOffer: 125000, customerAsk: 153500, scenario: "PREMIUM", margin: 18.6 },
    customer: { name: "House", tier: "Silver", healthScore: 68, avgOrder: 12200, frequency: "4/mo", openOrders: 30, paymentTerms: "Net 30", lastContact: "Yesterday", totalRevenue: 634817 },
  },
  {
    id: "7",
    from: "DHL Express",
    fromEmail: "noreply@dhl.com",
    company: "DHL",
    subject: "Shipment Update — Customs Hold (George Fashion Works)",
    preview: "Shipment for OXO order #6669 held at customs. Documentation required...",
    body: `Shipment Status Update:\n\nOrder Reference: 6669\nCustomer: George Fashion Works\nBrand: OXO\n\nCurrent status: Held at customs (Miami, FL)\nReason: Commercial invoice discrepancy\nOriginal ETA: February 25, 2026\nUpdated ETA: March 10, 2026\n\nAction required: Corrected commercial invoice matching PO amount ($174,608).\n\nDHL Express Tracking`,
    time: "Yesterday", timeAgo: "1d", isUnread: true, isArchived: false, isStarred: false,
    category: "shipping", urgency: "high", aiCategory: "Shipping Alert — Customs",
    aiSummary: "OXO order #6669 ($175K) for George Fashion Works held at Miami customs. Invoice discrepancy. 13-day delay. Corrected invoice needed.",
    attachments: [],
    threadCount: 2,
    hasOrder: true,
    linkedOrderNumber: "6669",
  },
];
