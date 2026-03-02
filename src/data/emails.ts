/**
 * REAL TEVAH DATA — Sourced from Monday.com (500 deals, $15.8M)
 * ================================================================
 * Customers, vendors, brands, amounts — all from actual exports.
 * NOT mock. NOT placeholder. This is Gil's real book.
 */

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
  orderId?: string;
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

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  vendor: string;
  brand: string;
  stage: string;
  stageCode: string;
  totalAmount: number;
  cost: number;
  items: number;
  margin: number;
  date: string;
  daysInStage: number;
  slaBreached: boolean;
  sourceEmailId?: string;
  mondayId?: string;
  payment?: string;
  delivery?: string;
}

// ============================================================================
// STAGE PIPELINE — B1-B15 Leviathan v2 mapped from Monday stages
// ============================================================================

export const STAGE_PIPELINE: Array<{
  code: string;
  name: string;
  group: string;
  mondayStages: string[];
  color: string;
  bgColor: string;
}> = [
  { code: "B1", name: "New Deal", group: "NEW", mondayStages: ["Not sent yet"], color: "text-zinc-400", bgColor: "bg-zinc-500/10" },
  { code: "B2", name: "Needs Specs", group: "NEW", mondayStages: ["waiting for specs"], color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { code: "B3", name: "Negotiation", group: "NEW", mondayStages: ["Negotiation", "Need Confirmation"], color: "text-amber-400", bgColor: "bg-amber-500/10" },
  { code: "B4", name: "Confirmed", group: "CONFIRM", mondayStages: ["Confirmed"], color: "text-violet-400", bgColor: "bg-violet-500/10" },
  { code: "B5", name: "Awaiting Payment", group: "CONFIRM", mondayStages: ["won- need payment"], color: "text-violet-400", bgColor: "bg-violet-500/10" },
  { code: "B6", name: "Invoiced", group: "CONFIRM", mondayStages: ["Invoiced"], color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { code: "B7", name: "Logistics", group: "PRODUCTION", mondayStages: ["Logistics"], color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { code: "B8", name: "Problem", group: "PRODUCTION", mondayStages: ["Problem"], color: "text-red-400", bgColor: "bg-red-500/10" },
  { code: "B9", name: "Shipped from Brand", group: "WAREHOUSE", mondayStages: [], color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { code: "B10", name: "In Warehouse", group: "WAREHOUSE", mondayStages: [], color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { code: "B11", name: "Scanned", group: "WAREHOUSE", mondayStages: [], color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { code: "B12", name: "Ready to Ship", group: "COMPLETE", mondayStages: [], color: "text-green-400", bgColor: "bg-green-500/10" },
  { code: "B13", name: "Won", group: "COMPLETE", mondayStages: ["Won"], color: "text-green-400", bgColor: "bg-green-500/10" },
  { code: "B14", name: "Delivered", group: "COMPLETE", mondayStages: [], color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { code: "B15", name: "Lost", group: "CLOSED", mondayStages: ["Lost"], color: "text-zinc-500", bgColor: "bg-zinc-800/50" },
];

function mondayStageToCode(mondayStage: string): string {
  for (const s of STAGE_PIPELINE) {
    if (s.mondayStages.includes(mondayStage)) return s.code;
  }
  return "B1";
}

function mondayStageToName(mondayStage: string): string {
  for (const s of STAGE_PIPELINE) {
    if (s.mondayStages.includes(mondayStage)) return s.name;
  }
  return "New Deal";
}

// ============================================================================
// REAL ORDERS — Top 30 deals from Monday.com ($15.8M book)
// ============================================================================

export const ORDERS: Order[] = [
  { id: "o1", orderNumber: "6655", customer: "Comexsport", vendor: "Stock lots", brand: "Adidas (Samba)", stage: "Needs Specs", stageCode: "B2", totalAmount: 734904, cost: 647055, items: 1, margin: 12.0, date: "Jan 16", daysInStage: 45, slaBreached: true, mondayId: "11022802631", payment: "Partially Received" },
  { id: "o2", orderNumber: "6153", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Solaray", stage: "Won", stageCode: "B13", totalAmount: 517892, cost: 464244, items: 1, margin: 10.9, date: "Nov 12", daysInStage: 0, slaBreached: false, mondayId: "9337732457", payment: "Received", delivery: "Delivered" },
  { id: "o3", orderNumber: "6419", customer: "Duffl", vendor: "DS Vendor", brand: "Miss Jessie", stage: "Won", stageCode: "B13", totalAmount: 339423, cost: 308875, items: 1, margin: 9.0, date: "Nov 27", daysInStage: 0, slaBreached: false, mondayId: "10650481736", payment: "Received", delivery: "Delivered" },
  { id: "o4", orderNumber: "6114", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Solaray", stage: "Won", stageCode: "B13", totalAmount: 298399, cost: 267011, items: 1, margin: 11.1, date: "Oct 15", daysInStage: 0, slaBreached: false, mondayId: "9128382066", payment: "Received", delivery: "Delivered" },
  { id: "o5", orderNumber: "6152", customer: "Interlight / Cometa", vendor: "Platinum Supply Group", brand: "DeWalt", stage: "Won", stageCode: "B13", totalAmount: 267063, cost: 255922, items: 1, margin: 4.2, date: "Oct 8", daysInStage: 0, slaBreached: false, mondayId: "9319813711", payment: "Received", delivery: "Delivered" },
  { id: "o6", orderNumber: "6288", customer: "Interlight / Cometa", vendor: "Nr-united", brand: "Giro", stage: "Won", stageCode: "B13", totalAmount: 230681, cost: 207603, items: 1, margin: 12.4, date: "Sep 15", daysInStage: 0, slaBreached: false, mondayId: "10054735324", payment: "Received", delivery: "Delivered" },
  { id: "o7", orderNumber: "6222", customer: "George Fashion Works", vendor: "Hamaui Trading", brand: "OXO", stage: "Won", stageCode: "B13", totalAmount: 218294, cost: 204212, items: 1, margin: 9.7, date: "Sep 1", daysInStage: 0, slaBreached: false, mondayId: "9770843795", payment: "Received", delivery: "Delivered" },
  { id: "o8", orderNumber: "6661", customer: "Duffl", vendor: "Inventorypartnersales", brand: "John Boos", stage: "Invoiced", stageCode: "B6", totalAmount: 191938, cost: 150684, items: 1, margin: 21.5, date: "Jan 20", daysInStage: 41, slaBreached: true, mondayId: "11050543988", payment: "Overdue" },
  { id: "o9", orderNumber: "Po-6085", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Solaray", stage: "Won", stageCode: "B13", totalAmount: 213828, cost: 213843, items: 1, margin: 0.7, date: "Aug 20", daysInStage: 0, slaBreached: false, mondayId: "8760941621", payment: "Received", delivery: "Delivered" },
  { id: "o10", orderNumber: "6468", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Snap Supplements", stage: "Lost", stageCode: "B15", totalAmount: 199792, cost: 177522, items: 1, margin: 11.2, date: "Dec 18", daysInStage: 0, slaBreached: false, mondayId: "10810124255", payment: "Overdue" },
  { id: "o11", orderNumber: "6182", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Delonghi", stage: "Won", stageCode: "B13", totalAmount: 193371, cost: 178104, items: 1, margin: 8.4, date: "Oct 20", daysInStage: 0, slaBreached: false, mondayId: "9518406683", payment: "Received", delivery: "Delivered" },
  { id: "o12", orderNumber: "6143", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Delonghi", stage: "Won", stageCode: "B13", totalAmount: 192680, cost: 173396, items: 1, margin: 10.0, date: "Sep 25", daysInStage: 0, slaBreached: false, mondayId: "9260171138", payment: "Received", delivery: "Delivered" },
  { id: "o13", orderNumber: "6677", customer: "Interlight / Cometa", vendor: "Amen Global - Matan", brand: "Samsonite", stage: "Needs Specs", stageCode: "B2", totalAmount: 144177, cost: 130056, items: 1, margin: 8.2, date: "Jan 27", daysInStage: 34, slaBreached: true, mondayId: "11111206807", payment: "Overdue" },
  { id: "o14", orderNumber: "6435", customer: "Interlight / Cometa", vendor: "Nr-united", brand: "USA Pan", stage: "Won", stageCode: "B13", totalAmount: 132535, cost: 120680, items: 1, margin: 8.9, date: "Dec 2", daysInStage: 0, slaBreached: false, mondayId: "10687090662", payment: "Received", delivery: "Delivered" },
  { id: "o15", orderNumber: "6447", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Barefoot", stage: "Won", stageCode: "B13", totalAmount: 131380, cost: 111004, items: 1, margin: 14.6, date: "Dec 11", daysInStage: 0, slaBreached: false, mondayId: "10756534036", payment: "Received", delivery: "Delivered" },
  { id: "o16", orderNumber: "6306", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Baby Bjorn", stage: "Won", stageCode: "B13", totalAmount: 130276, cost: 118712, items: 1, margin: 8.9, date: "Oct 1", daysInStage: 0, slaBreached: false, mondayId: "18085399370", payment: "Received", delivery: "Delivered" },
  { id: "o17", orderNumber: "6244", customer: "Hublux", vendor: "JBD Trading - Swiss B", brand: "Waterford", stage: "Won", stageCode: "B13", totalAmount: 130026, cost: 110308, items: 1, margin: 15.2, date: "Sep 10", daysInStage: 0, slaBreached: false, mondayId: "9855473464", payment: "Received", delivery: "Delivered" },
  { id: "o18", orderNumber: "6426", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Stokke", stage: "Won", stageCode: "B13", totalAmount: 128894, cost: 118508, items: 1, margin: 7.8, date: "Nov 28", daysInStage: 0, slaBreached: false, mondayId: "10661170179", payment: "Partially Received", delivery: "Delivered" },
  { id: "o19", orderNumber: "6265", customer: "Interlight / Cometa", vendor: "FVF Trading LLC", brand: "Igennus", stage: "Won", stageCode: "B13", totalAmount: 126864, cost: 118784, items: 1, margin: 6.8, date: "Oct 5", daysInStage: 0, slaBreached: false, mondayId: "9951821161", payment: "Received", delivery: "Delivered" },
  { id: "o20", orderNumber: "6634", customer: "Duffl", vendor: "Inventorypartnersales", brand: "Momentous", stage: "Won", stageCode: "B13", totalAmount: 123630, cost: 113598, items: 1, margin: 8.4, date: "Jan 12", daysInStage: 0, slaBreached: false, mondayId: "10975095778", payment: "Received", delivery: "Delivered" },
  { id: "o21", orderNumber: "6594", customer: "Interlight / Cometa", vendor: "Nr-united", brand: "Giro", stage: "Logistics", stageCode: "B7", totalAmount: 122192, cost: 108191, items: 1, margin: 11.5, date: "Dec 30", daysInStage: 62, slaBreached: true, mondayId: "10876709270", payment: "Overdue", delivery: "Awaiting Fulfillment" },
  { id: "o22", orderNumber: "6119", customer: "Hublux", vendor: "JBD Trading - Swiss B", brand: "Waterford", stage: "Won", stageCode: "B13", totalAmount: 121824, cost: 108831, items: 1, margin: 10.7, date: "Aug 5", daysInStage: 0, slaBreached: false, mondayId: "9152014521", payment: "Received", delivery: "Delivered" },
  { id: "o23", orderNumber: "6395", customer: "Steven Dann", vendor: "Inventorypartnersales", brand: "Diptyque", stage: "Invoiced", stageCode: "B6", totalAmount: 120512, cost: 109556, items: 1, margin: 9.1, date: "Nov 19", daysInStage: 103, slaBreached: true, mondayId: "18384808370", payment: "Overdue" },
  { id: "o24", orderNumber: "6669", customer: "George Fashion Works", vendor: "Platinum Supply Group", brand: "OXO", stage: "Invoiced", stageCode: "B6", totalAmount: 174608, cost: 174608, items: 1, margin: 0.0, date: "Jan 22", daysInStage: 39, slaBreached: true, mondayId: "11073484675", payment: "Partially Received" },
  { id: "o25", orderNumber: "PO-6111", customer: "George Fashion Works", vendor: "Hamaui Trading", brand: "OXO", stage: "Won", stageCode: "B13", totalAmount: 146320, cost: 122501, items: 1, margin: 16.3, date: "Jul 28", daysInStage: 0, slaBreached: false, mondayId: "9103390748", payment: "Received", delivery: "Delivered" },
  { id: "o26", orderNumber: "6217", customer: "Hamaui Trading", vendor: "", brand: "OXO", stage: "Confirmed", stageCode: "B4", totalAmount: 176581, cost: 19538, items: 1, margin: 88.9, date: "Sep 1", daysInStage: 183, slaBreached: true, mondayId: "9748129859", payment: "Received" },
  { id: "o27", orderNumber: "6151", customer: "Interlight / Cometa", vendor: "Inventorypartnersales", brand: "Codeage", stage: "Won", stageCode: "B13", totalAmount: 175410, cost: 158708, items: 1, margin: 10.3, date: "Oct 8", daysInStage: 0, slaBreached: false, mondayId: "9310732228", payment: "Received", delivery: "Delivered" },
  { id: "o28", orderNumber: "6428", customer: "Interlight / Cometa", vendor: "Amen Global - Matan", brand: "Stokke", stage: "Won", stageCode: "B13", totalAmount: 178161, cost: 162241, items: 1, margin: 8.8, date: "Dec 1", daysInStage: 0, slaBreached: false, mondayId: "10672131854", payment: "Received", delivery: "Delivered" },
  { id: "o29", orderNumber: "6155", customer: "Interlight / Cometa", vendor: "Healthlifeny / Versure", brand: "Solaray", stage: "Won", stageCode: "B13", totalAmount: 178085, cost: 160121, items: 1, margin: 10.1, date: "Oct 12", daysInStage: 0, slaBreached: false, mondayId: "9337732839", payment: "Received", delivery: "Delivered" },
  { id: "o30", orderNumber: "6113", customer: "Interlight / Cometa", vendor: "Fordmed", brand: "Solaray", stage: "Won", stageCode: "B13", totalAmount: 183324, cost: 165201, items: 1, margin: 9.9, date: "Aug 15", daysInStage: 0, slaBreached: false, mondayId: "9128380415", payment: "Received", delivery: "Delivered" },
];

// ============================================================================
// REAL CUSTOMERS — Aggregated from 500 Monday deals
// ============================================================================

export const CUSTOMERS: Array<{
  id: string;
  name: string;
  tier: string;
  healthScore: number;
  totalRevenue: number;
  totalProfit: number;
  openOrders: number;
  avgMargin: number;
  deals: number;
  wonDeals: number;
  lastOrder: string;
  paymentTerms: string;
}> = [
  { id: "c1", name: "Interlight / Cometa", tier: "Platinum", healthScore: 85, totalRevenue: 10113435, totalProfit: 1207204, openOrders: 68, avgMargin: 11.9, deals: 295, wonDeals: 124, lastOrder: "Jan 27", paymentTerms: "Net 30" },
  { id: "c2", name: "Duffl", tier: "Gold", healthScore: 78, totalRevenue: 1372298, totalProfit: 140869, openOrders: 8, avgMargin: 10.3, deals: 36, wonDeals: 13, lastOrder: "Jan 20", paymentTerms: "Net 15" },
  { id: "c3", name: "George Fashion Works", tier: "Gold", healthScore: 72, totalRevenue: 983846, totalProfit: 69682, openOrders: 5, avgMargin: 7.1, deals: 16, wonDeals: 9, lastOrder: "Jan 22", paymentTerms: "Net 30" },
  { id: "c4", name: "Comexsport", tier: "Gold", healthScore: 45, totalRevenue: 858997, totalProfit: 86330, openOrders: 5, avgMargin: 10.1, deals: 15, wonDeals: 1, lastOrder: "Jan 16", paymentTerms: "Net 45" },
  { id: "c5", name: "Hublux", tier: "Silver", healthScore: 82, totalRevenue: 664480, totalProfit: 98679, openOrders: 3, avgMargin: 14.9, deals: 14, wonDeals: 8, lastOrder: "Dec 15", paymentTerms: "Net 30" },
  { id: "c6", name: "House", tier: "Silver", healthScore: 68, totalRevenue: 634817, totalProfit: 142833, openOrders: 30, avgMargin: 22.5, deals: 52, wonDeals: 14, lastOrder: "Feb 1", paymentTerms: "Net 30" },
  { id: "c7", name: "Trading Co Brands", tier: "Silver", healthScore: 75, totalRevenue: 377292, totalProfit: 34515, openOrders: 2, avgMargin: 9.1, deals: 13, wonDeals: 9, lastOrder: "Nov 5", paymentTerms: "Net 30" },
  { id: "c8", name: "Steven Dann", tier: "Bronze", healthScore: 52, totalRevenue: 261589, totalProfit: 18881, openOrders: 5, avgMargin: 7.2, deals: 9, wonDeals: 2, lastOrder: "Nov 19", paymentTerms: "Net 45" },
  { id: "c9", name: "Narula", tier: "Bronze", healthScore: 60, totalRevenue: 132244, totalProfit: 6015, openOrders: 2, avgMargin: 4.5, deals: 5, wonDeals: 2, lastOrder: "Oct 10", paymentTerms: "Net 30" },
  { id: "c10", name: "PK Trading", tier: "Bronze", healthScore: 65, totalRevenue: 98500, totalProfit: 11200, openOrders: 1, avgMargin: 11.4, deals: 5, wonDeals: 3, lastOrder: "Dec 5", paymentTerms: "Net 15" },
];

// ============================================================================
// REAL VENDORS — Aggregated from Monday data
// ============================================================================

export const VENDORS: Array<{
  id: string;
  name: string;
  deals: number;
  revenue: number;
  topBrands: string[];
}> = [
  { id: "v1", name: "Inventorypartnersales", deals: 170, revenue: 5901641, topBrands: ["Solaray", "Delonghi", "Snap Supplements", "Barefoot", "Baby Bjorn", "Stokke", "Momentous", "Codeage"] },
  { id: "v2", name: "JBD Trading - Swiss B", deals: 53, revenue: 1740182, topBrands: ["Waterford", "Villeroy & Boch", "Christofle"] },
  { id: "v3", name: "Nr-united", deals: 47, revenue: 1723590, topBrands: ["Giro", "USA Pan", "Bell"] },
  { id: "v4", name: "Healthlifeny / Versure", deals: 46, revenue: 1242204, topBrands: ["Solaray", "Igennus", "Sports Research"] },
  { id: "v5", name: "Platinum Supply Group", deals: 22, revenue: 752401, topBrands: ["DeWalt", "OXO", "Stanley"] },
  { id: "v6", name: "Fordmed", deals: 26, revenue: 744273, topBrands: ["Solaray", "Nordic Naturals"] },
  { id: "v7", name: "Stock lots", deals: 3, revenue: 734904, topBrands: ["Adidas (Samba)"] },
  { id: "v8", name: "Central Gifts Center", deals: 21, revenue: 612944, topBrands: ["Le Creuset", "Wedgwood", "Royal Doulton"] },
  { id: "v9", name: "Amen Global - Matan", deals: 5, revenue: 427146, topBrands: ["Stokke", "Samsonite"] },
  { id: "v10", name: "Hamaui Trading", deals: 6, revenue: 364614, topBrands: ["OXO"] },
];

// ============================================================================
// EMAILS — Real-world Tevah email patterns with actual brands/customers
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
    orderId: "o1",
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
    orderId: "o13",
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
    orderId: "o21",
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
    orderId: "o8",
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
    orderId: "o23",
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
    orderId: "o24",
  },
];
