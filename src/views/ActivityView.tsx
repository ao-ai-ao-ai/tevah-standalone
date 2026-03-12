/**
 * ActivityView — Unified activity feed across deals, emails, and payments
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Zap, Mail, DollarSign, Package, Clock,
  AlertTriangle, CheckCircle2, ArrowUpRight,
  Filter,
} from "lucide-react";
import { ALL_DEALS } from "../data/monday";
import { cn, formatCurrency } from "../lib/utils";
import { marginColor } from "../lib/design-tokens";
import { StagePill } from "../components/stage-pill";
import { Card } from "../components/card";
import { useLiveEmails } from "../lib/use-live-emails";

type ActivityType = "deal" | "email" | "payment";
type FilterTab = "all" | "deals" | "emails" | "payments";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  value?: number;
  margin?: number;
  stage?: string;
  urgency?: "high" | "medium" | "low";
  dealNumber?: string;
}

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Zap; color: string; dotColor: string }> = {
  deal:    { icon: Package,    color: "text-purple-600", dotColor: "bg-purple-500" },
  email:   { icon: Mail,       color: "text-blue-600",   dotColor: "bg-blue-500" },
  payment: { icon: DollarSign, color: "text-emerald-600", dotColor: "bg-emerald-500" },
};

export function ActivityView() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const { emails, loading: emailsLoading } = useLiveEmails("all", 30);

  const activities = useMemo(() => {
    const items: Activity[] = [];

    // Deal stage activities from real Monday data
    const activeDeals = ALL_DEALS.filter(d => !["Won", "Lost"].includes(d.stage));
    for (const deal of activeDeals.slice(0, 30)) {
      items.push({
        id: `deal-${deal.id}`,
        type: "deal",
        title: `${deal.brand} — ${deal.stage}`,
        subtitle: `${deal.customer} via ${deal.vendor}`,
        timestamp: deal.date || "",
        value: deal.sellTotal,
        margin: deal.margin,
        stage: deal.stage,
        dealNumber: deal.dealNumber,
      });
    }

    // Payment activities
    const paymentDeals = ALL_DEALS.filter(d =>
      d.payment === "Overdue" || d.payment === "Received" || d.payment === "Partially Received"
    );
    for (const deal of paymentDeals.slice(0, 15)) {
      const isOverdue = deal.payment === "Overdue";
      items.push({
        id: `pay-${deal.id}`,
        type: "payment",
        title: `${deal.payment} — #${deal.dealNumber}`,
        subtitle: `${deal.customer} · ${deal.brand}`,
        timestamp: deal.date || "",
        value: deal.sellTotal,
        urgency: isOverdue ? "high" : "low",
        dealNumber: deal.dealNumber,
      });
    }

    // Email activities from brain
    if (emails.length > 0) {
      for (const email of emails.slice(0, 20)) {
        items.push({
          id: `email-${email.id}`,
          type: "email",
          title: email.subject,
          subtitle: `${email.from} · ${email.direction}`,
          timestamp: email.date,
          urgency: email.urgency === "urgent" ? "high" : email.urgency === "high" ? "medium" : "low",
          dealNumber: email.dealNumbers?.[0],
        });
      }
    }

    // Sort by date descending
    items.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return items;
  }, [emails]);

  const filtered = filter === "all"
    ? activities
    : activities.filter(a =>
        filter === "deals" ? a.type === "deal" :
        filter === "emails" ? a.type === "email" :
        a.type === "payment"
      );

  const counts = useMemo(() => ({
    all: activities.length,
    deals: activities.filter(a => a.type === "deal").length,
    emails: activities.filter(a => a.type === "email").length,
    payments: activities.filter(a => a.type === "payment").length,
  }), [activities]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "deals", label: "Deals" },
    { key: "emails", label: "Emails" },
    { key: "payments", label: "Payments" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Activity</h1>
              <p className="text-xs text-text-tertiary mt-0.5">{activities.length} events across deals, emails, and payments</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-tertiary">
              {emailsLoading && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Loading emails...
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === tab.key
                  ? "bg-purple-50 text-purple-600 border border-purple-200/50"
                  : "text-text-secondary hover:text-text-primary hover:bg-hover"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-[10px] font-mono",
                filter === tab.key ? "text-purple-400" : "text-text-tertiary"
              )}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {filtered.map((activity, idx) => {
            const config = TYPE_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-start gap-3 py-3 border-b border-divider last:border-b-0 hover:bg-hover/50 px-2 -mx-2 rounded-lg transition-colors"
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className={cn("w-2.5 h-2.5 rounded-full", config.dotColor)} />
                  {idx < filtered.length - 1 && (
                    <div className="w-px flex-1 bg-divider mt-1 min-h-[16px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", config.color)} />
                    <span className="text-[12px] font-medium text-text-primary truncate">
                      {activity.title}
                    </span>
                    {activity.urgency === "high" && (
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-5.5">
                    <span className="text-[11px] text-text-tertiary truncate">{activity.subtitle}</span>
                    {activity.dealNumber && (
                      <span className="text-[9px] font-mono text-text-disabled">#{activity.dealNumber}</span>
                    )}
                  </div>
                </div>

                {/* Right side: value + time */}
                <div className="flex items-center gap-3 shrink-0">
                  {activity.stage && <StagePill stage={activity.stage} size="xs" />}
                  {activity.margin != null && activity.margin > 0 && (
                    <span className={cn("text-[10px] font-mono font-semibold tabular-nums", marginColor(activity.margin))}>
                      {activity.margin.toFixed(0)}%
                    </span>
                  )}
                  {activity.value != null && activity.value > 0 && (
                    <span className="text-[11px] font-mono text-text-secondary tabular-nums">
                      {formatCurrency(activity.value)}
                    </span>
                  )}
                  {activity.timestamp && (
                    <span className="text-[10px] text-text-disabled tabular-nums font-mono w-[70px] text-right">
                      {formatDate(activity.timestamp)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-text-tertiary">
              <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No activity in this filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}
