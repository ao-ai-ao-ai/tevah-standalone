/**
 * InboxView v2 — Superhuman-grade email for wholesale
 *
 * Keyboard-first: j/k navigate, e archive, s star, r reply, / search, esc close
 * 4-pane: Mailbox rail | Email list | Thread view | Intelligence panel
 * Real data: 21K+ emails via brain API, deal threading, contextual AI
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";
import { useLiveEmails, useEmailContext, useEmailThread, type LiveEmail } from "../lib/use-live-emails";
import {
  Search, Star, Archive, Reply, Forward, Paperclip,
  Inbox, Mail, Send, Users, Tag, AlertTriangle,
  ShoppingCart, Truck, CreditCard, Brain, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, ArrowDownLeft,
  ArrowUpRight, ArrowLeftRight, Zap, Package,
  MessageSquare, Hash, ChevronDown, Clock, Keyboard,
  CornerDownLeft, X,
} from "lucide-react";

// ─── Mailbox items ────────────────────────────────────────────────────────────

interface MailboxItem {
  id: string;
  label: string;
  icon: typeof Mail;
  direction?: string;
  color: string;
  shortcut?: string;
}

const MAILBOXES: MailboxItem[] = [
  { id: "unified", label: "Unified", icon: Inbox, color: "text-purple-500", shortcut: "U" },
  { id: "inbound", label: "Inbound", icon: ArrowDownLeft, direction: "inbound", color: "text-blue-500", shortcut: "I" },
  { id: "sent", label: "Sent", icon: Send, direction: "outbound", color: "text-text-tertiary", shortcut: "S" },
  { id: "internal", label: "Internal", icon: Users, direction: "internal", color: "text-amber-500" },
  { id: "offers", label: "Offers", icon: Tag, color: "text-emerald-500" },
];

// ─── Category tabs ────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { id: "all", label: "All", icon: Mail },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "quotes", label: "Quotes", icon: Tag },
  { id: "suppliers", label: "Suppliers", icon: Package },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payments", label: "Payments", icon: CreditCard },
];

// ─── Action type badges ───────────────────────────────────────────────────────

const ACTION_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  new_offer: { label: "Offer", color: "text-emerald-700", bg: "bg-emerald-50" },
  payment_received: { label: "Payment", color: "text-green-700", bg: "bg-green-50" },
  payment_due: { label: "Due", color: "text-red-700", bg: "bg-red-50" },
  status_confirmed: { label: "Confirmed", color: "text-blue-700", bg: "bg-blue-50" },
  status_shipped: { label: "Shipped", color: "text-violet-700", bg: "bg-violet-50" },
  status_delivered: { label: "Delivered", color: "text-green-700", bg: "bg-green-50" },
  issue: { label: "Issue", color: "text-red-700", bg: "bg-red-50" },
  quote_request: { label: "Quote", color: "text-purple-700", bg: "bg-purple-50" },
  info: { label: "Info", color: "text-text-tertiary", bg: "bg-canvas" },
};

function ActionBadge({ type }: { type: string }) {
  const style = ACTION_STYLES[type] || ACTION_STYLES.info;
  if (type === "info") return null;
  return <span className={cn("text-[8px] font-semibold px-1.5 py-0.5 rounded", style.bg, style.color)}>{style.label}</span>;
}

function DirectionBadge({ dir }: { dir: string }) {
  if (dir === "inbound") return <span className="inline-flex items-center gap-0.5 text-[7px] font-bold px-1 py-px rounded bg-blue-50 text-blue-600"><ArrowDownLeft className="w-2 h-2" />IN</span>;
  if (dir === "outbound") return <span className="inline-flex items-center gap-0.5 text-[7px] font-bold px-1 py-px rounded bg-gray-100 text-text-tertiary"><ArrowUpRight className="w-2 h-2" />OUT</span>;
  if (dir === "internal") return <span className="inline-flex items-center gap-0.5 text-[7px] font-bold px-1 py-px rounded bg-amber-50 text-amber-600"><ArrowLeftRight className="w-2 h-2" />INT</span>;
  return null;
}

const URGENCY_BORDER: Record<string, string> = {
  urgent: "border-l-red-500/70",
  high: "border-l-amber-500/50",
  medium: "border-l-blue-500/25",
  low: "border-l-transparent",
};

// ─── Email body renderer (handles raw text properly) ──────────────────────────

function EmailBody({ body }: { body: string }) {
  if (!body) return <p className="text-sm text-text-tertiary italic">No content</p>;

  // Strip the brain metadata prefix (everything before the actual body)
  let clean = body;
  const bodyMarkers = ["Hello", "Hi ", "Dear ", "Good ", "Hey ", "Thank", "Please", "We ", "I "];
  for (const marker of bodyMarkers) {
    const idx = clean.indexOf(marker);
    if (idx > 0 && idx < 500) {
      clean = clean.slice(idx);
      break;
    }
  }

  // Convert \r\n to actual newlines, clean up excessive whitespace
  clean = clean
    .replace(/\\r\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");

  // Truncate very long bodies (brain sends full thread in body)
  const lines = clean.split("\n");
  const truncated = lines.length > 80;
  const displayLines = truncated ? lines.slice(0, 80) : lines;

  return (
    <div className="whitespace-pre-wrap text-[13px] text-text-secondary leading-[1.7] max-w-2xl font-[system-ui]">
      {displayLines.join("\n")}
      {truncated && (
        <p className="text-xs text-text-tertiary mt-4 italic">... {lines.length - 80} more lines</p>
      )}
    </div>
  );
}

// ─── Keyboard hints tooltip ───────────────────────────────────────────────────

function KeyboardHints({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl px-5 py-3 shadow-xl border border-gray-700"
    >
      <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-[11px]">
        {[
          ["j / k", "Navigate"],
          ["Enter", "Open email"],
          ["e", "Archive"],
          ["s", "Star / unstar"],
          ["/", "Search"],
          ["Esc", "Close / back"],
          ["r", "Reply"],
          ["f", "Forward"],
          ["?", "Toggle shortcuts"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-[10px] min-w-[24px] text-center">{key}</kbd>
            <span className="text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Context intelligence panel ───────────────────────────────────────────────

function IntelPanel({ email }: { email: LiveEmail }) {
  const { context, loading } = useEmailContext(email.id);

  return (
    <div className="space-y-3">
      {/* Suggested action */}
      {context?.suggestedAction && context.suggestedAction.label !== "No Action" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-700">Next Step</span>
          </div>
          <p className="text-xs font-semibold text-emerald-800">{context.suggestedAction.label}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">{context.suggestedAction.description}</p>
        </div>
      )}

      {/* Thread context */}
      {context?.thread && (
        <div className="rounded-xl bg-white border border-divider p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-purple-600">Thread</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-tertiary">Deal</span>
              <span className="font-mono font-medium text-purple-600">#{context.thread.deal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Emails</span>
              <span className="font-semibold">{context.thread.emailCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Date Range</span>
              <span className="text-text-secondary">{context.thread.dateRange}</span>
            </div>
            {context.thread.participants?.length > 0 && (
              <div className="pt-1.5 border-t border-divider mt-1.5">
                <span className="text-[9px] text-text-tertiary block mb-1">Participants</span>
                <div className="flex flex-wrap gap-1">
                  {context.thread.participants.slice(0, 8).map((p: string, i: number) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-canvas text-text-secondary">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Intelligence */}
      <div className="rounded-xl bg-white border border-divider overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-purple-500 via-violet-400 to-purple-600" />
        <div className="px-3.5 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-purple-600">Intelligence</span>
            {loading && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[100, 80, 60].map(w => (
                <div key={w} className="h-3 bg-purple-50 rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : context?.intelligence ? (
            <div className="text-[12px] text-text-primary leading-[1.65] space-y-1.5">
              {context.intelligence.split(/(?<=\.)\s+/).slice(0, 6).map((s: string, i: number) => (
                <p key={i} className={/\$|%|\d{2,}/.test(s) ? "font-medium" : ""}>{s}</p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-tertiary italic">No intelligence available</p>
          )}
        </div>
      </div>

      {/* Email details */}
      <div className="rounded-xl bg-white border border-divider p-3.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-2">Details</h4>
        <div className="space-y-1.5 text-[11px]">
          {[
            ["Direction", <DirectionBadge key="d" dir={email.direction} />],
            ["From", <span key="f" className="text-text-primary font-medium truncate ml-4">{email.from}</span>],
            ["To", <span key="t" className="text-text-primary truncate ml-4">{email.to}</span>],
            ...(email.date ? [["Date", <span key="dt" className="text-text-primary">{email.date}</span>]] : []),
            ...(email.ccCount > 0 ? [["CC", <span key="cc" className="text-text-primary">{email.ccCount} people</span>]] : []),
            ...(email.attachments > 0 ? [["Attachments", <span key="att" className="text-text-primary">{email.attachments} files</span>]] : []),
          ].map(([label, value], i) => (
            <div key={i} className="flex justify-between items-center">{typeof label === "string" ? <span className="text-text-tertiary">{label}</span> : label}{value}</div>
          ))}
          {email.dealNumbers?.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-text-tertiary">Deal(s)</span>
              <div className="flex gap-1">{email.dealNumbers.slice(0, 3).map(d => (
                <span key={d} className="font-mono text-purple-600 font-medium">#{d}</span>
              ))}</div>
            </div>
          )}
        </div>
        {(email.actionType !== "info" || (email.types?.length > 0)) && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-divider">
            <ActionBadge type={email.actionType} />
            {email.types?.map(t => (
              <span key={t} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200/40">
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Thread view (center pane) ────────────────────────────────────────────────

function ThreadView({ email, onViewThread, onBack, starred, onToggleStar, archived, onArchive }: {
  email: LiveEmail;
  onViewThread: (deal: string) => void;
  onBack: () => void;
  starred: boolean;
  onToggleStar: () => void;
  archived: boolean;
  onArchive: () => void;
}) {
  const { thread } = useEmailThread(email.dealNumbers?.[0] || null);
  const [expanded, setExpanded] = useState(false);
  const hasThread = thread && thread.count > 1;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white">
      {/* Header */}
      <div className="flex-none px-5 py-3 border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary truncate">{email.subject}</h2>
              <DirectionBadge dir={email.direction} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-text-tertiary">{email.from} &lt;{email.fromEmail}&gt;</span>
              {email.date && (
                <>
                  <span className="text-[10px] text-text-disabled">&middot;</span>
                  <span className="text-[10px] text-text-tertiary">{email.date}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-none">
            <button onClick={onToggleStar} className="p-1.5 rounded-md hover:bg-hover transition-colors" title="Star (s)">
              <Star className={cn("w-3.5 h-3.5 transition-colors", starred ? "text-amber-400 fill-amber-400" : "text-text-tertiary")} />
            </button>
            <button onClick={onArchive} className={cn("p-1.5 rounded-md hover:bg-hover transition-colors", archived && "bg-emerald-50")} title="Archive (e)">
              <Archive className={cn("w-3.5 h-3.5", archived ? "text-emerald-500" : "text-text-tertiary")} />
            </button>
          </div>
        </div>
        {/* Tags bar */}
        <div className="flex items-center gap-2 mt-2">
          <ActionBadge type={email.actionType} />
          {email.dealNumbers?.map(d => (
            <button key={d} onClick={() => onViewThread(d)}
              className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
              #{d} thread
            </button>
          ))}
          {email.urgency === "urgent" && (
            <span className="text-[9px] font-medium text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Urgent
            </span>
          )}
        </div>
      </div>

      {/* Thread banner */}
      {hasThread && !expanded && (
        <button onClick={() => setExpanded(true)}
          className="flex-none flex items-center gap-2 px-5 py-2 bg-purple-50/50 border-b border-divider hover:bg-purple-50 transition-colors">
          <MessageSquare className="w-3 h-3 text-purple-500" />
          <span className="text-[11px] text-purple-600 font-medium">{thread.count} emails in this conversation</span>
          <ChevronDown className="w-3 h-3 text-purple-400" />
        </button>
      )}

      {/* Thread expanded */}
      {hasThread && expanded && (
        <div className="flex-none max-h-[200px] overflow-y-auto border-b border-divider bg-canvas">
          <div className="px-5 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-purple-600">Conversation ({thread.count} emails)</span>
              <button onClick={() => setExpanded(false)} className="text-[10px] text-text-tertiary hover:text-text-primary">Collapse</button>
            </div>
            <div className="space-y-1">
              {thread.emails.map((te: LiveEmail) => (
                <div key={te.id} className={cn(
                  "flex items-center gap-2 py-1 px-2 rounded text-[10px] transition-colors",
                  te.id === email.id ? "bg-purple-50 font-medium" : "hover:bg-hover"
                )}>
                  <DirectionBadge dir={te.direction} />
                  <span className="text-text-secondary truncate flex-1">{te.from}</span>
                  <span className="text-text-tertiary flex-none">{te.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Email body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <EmailBody body={email.body} />
        <div className="mt-6 flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm">
            <Reply className="w-3.5 h-3.5" /> Reply
            <kbd className="text-[9px] text-purple-300 ml-1">R</kbd>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-lg bg-white border border-divider text-text-secondary hover:text-text-primary hover:border-gray-300 transition-colors">
            <Forward className="w-3.5 h-3.5" /> Forward
            <kbd className="text-[9px] text-text-disabled ml-1">F</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main InboxView ───────────────────────────────────────────────────────────

export function InboxView() {
  const {
    emails, total, categories, directionCounts, threadCount,
    loading, error, page, setPage,
    search, setSearch, category, setCategory,
    direction, setDirection, deal, setDeal, refresh,
  } = useLiveEmails("all", 60);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [activeMailbox, setActiveMailbox] = useState("unified");
  const [showHints, setShowHints] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem("tevah-starred"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem("tevah-archived"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Persist star/archive
  useEffect(() => { localStorage.setItem("tevah-starred", JSON.stringify([...starredIds])); }, [starredIds]);
  useEffect(() => { localStorage.setItem("tevah-archived", JSON.stringify([...archivedIds])); }, [archivedIds]);

  // Filter out archived (unless viewing archived)
  const visibleEmails = useMemo(() =>
    emails.filter(e => !archivedIds.has(e.id)),
    [emails, archivedIds]
  );

  const selectedEmail = visibleEmails[selectedIdx] || null;
  const selectedId = selectedEmail?.id || null;

  // Clamp index when list changes
  useEffect(() => {
    if (selectedIdx >= visibleEmails.length && visibleEmails.length > 0) {
      setSelectedIdx(visibleEmails.length - 1);
    }
  }, [visibleEmails.length, selectedIdx]);

  // Auto-select first email on load
  useEffect(() => {
    if (visibleEmails.length > 0 && selectedIdx === 0) {
      setSelectedIdx(0);
    }
  }, [visibleEmails]);

  const totalPages = Math.ceil(total / 60);

  const toggleStar = useCallback((id: string) => {
    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const archiveEmail = useCallback((id: string) => {
    setArchivedIds(prev => new Set([...prev, id]));
    // Move to next email
    if (selectedIdx < visibleEmails.length - 1) {
      // Index stays, next email slides in
    } else if (selectedIdx > 0) {
      setSelectedIdx(selectedIdx - 1);
    }
  }, [selectedIdx, visibleEmails.length]);

  // Mailbox change
  const handleMailboxChange = (mb: MailboxItem) => {
    setActiveMailbox(mb.id);
    setSelectedIdx(0);
    if (mb.id === "offers") { setDirection(""); setCategory("offers"); setDeal(""); }
    else { setDirection(mb.direction || ""); setCategory("all"); setDeal(""); }
  };

  const handleViewThread = (dealNum: string) => {
    setDeal(dealNum);
    setActiveMailbox("unified");
    setDirection("");
    setCategory("all");
    setSelectedIdx(0);
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

      // / focuses search from anywhere
      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Escape: blur search or close hints
      if (e.key === "Escape") {
        if (isInput) { (target as HTMLInputElement).blur(); return; }
        setShowHints(false);
        return;
      }

      if (isInput) return; // All other shortcuts require focus outside input

      switch (e.key) {
        case "j": case "ArrowDown":
          e.preventDefault();
          setSelectedIdx(prev => Math.min(prev + 1, visibleEmails.length - 1));
          break;
        case "k": case "ArrowUp":
          e.preventDefault();
          setSelectedIdx(prev => Math.max(prev - 1, 0));
          break;
        case "e":
          if (selectedEmail) archiveEmail(selectedEmail.id);
          break;
        case "s":
          if (selectedEmail) toggleStar(selectedEmail.id);
          break;
        case "?":
          setShowHints(prev => !prev);
          break;
        case "r":
          // TODO: open reply composer
          break;
        case "f":
          // TODO: open forward composer
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visibleEmails.length, selectedEmail, archiveEmail, toggleStar]);

  // Scroll selected email into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIdx] as HTMLElement;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIdx]);

  const formatCount = (n: number) => n > 999 ? `${(n / 1000).toFixed(1)}k` : String(n);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex relative">
      {/* Keyboard hints overlay */}
      <AnimatePresence><KeyboardHints visible={showHints} /></AnimatePresence>

      {/* ─── Mailbox rail ─── */}
      <div className="w-[56px] flex-none flex flex-col items-center py-3 gap-1 border-r border-divider bg-canvas">
        {MAILBOXES.map(mb => {
          const count = mb.id === "unified" ? total
            : mb.id === "offers" ? (categories.offers || 0)
            : (directionCounts[mb.direction || ""] || 0);
          const Icon = mb.icon;
          return (
            <button key={mb.id} onClick={() => handleMailboxChange(mb)}
              title={`${mb.label} (${formatCount(count)})${mb.shortcut ? ` — ${mb.shortcut}` : ""}`}
              className={cn(
                "relative w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                activeMailbox === mb.id ? "bg-purple-50 text-purple-600 shadow-sm" : "text-text-tertiary hover:text-text-secondary hover:bg-hover"
              )}>
              <Icon className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-purple-500 text-white text-[7px] font-bold flex items-center justify-center px-0.5">
                  {count > 999 ? `${Math.floor(count / 1000)}k` : count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          );
        })}
        <div className="mt-auto space-y-2 flex flex-col items-center">
          <div className="text-center">
            <Hash className="w-3.5 h-3.5 text-text-disabled mx-auto" />
            <span className="text-[8px] text-text-disabled block mt-0.5">{formatCount(threadCount)}</span>
          </div>
          <button onClick={() => setShowHints(h => !h)} title="Keyboard shortcuts (?)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-disabled hover:text-text-tertiary hover:bg-hover transition-colors">
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Email list ─── */}
      <div className="w-[340px] flex-none flex flex-col border-r border-divider bg-sidebar">
        {/* Header */}
        <div className="flex-none px-3 py-2 border-b border-divider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-text-primary">
              {MAILBOXES.find(m => m.id === activeMailbox)?.label || "Inbox"}
            </h3>
            {deal && (
              <span className="flex items-center gap-1 text-[9px] font-mono bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                Thread #{deal}
                <button onClick={() => { setDeal(""); setActiveMailbox("unified"); }} className="text-purple-400 hover:text-purple-600 ml-0.5">&times;</button>
              </span>
            )}
          </div>
          <button onClick={refresh} className="p-1 rounded hover:bg-hover transition-colors" title="Refresh">
            <RefreshCw className={cn("w-3 h-3 text-text-tertiary", loading && "animate-spin")} />
          </button>
        </div>

        {/* Search */}
        <div className="flex-none px-3 py-2 border-b border-divider">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input ref={searchRef} value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setSearch(e.target.value); }}
              placeholder="Search emails... ( / )"
              className="w-full h-7 pl-8 pr-3 text-[11px] bg-white border border-divider rounded-md text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-purple-300 transition-colors" />
          </div>
        </div>

        {/* Category tabs */}
        {!deal && (
          <div className="flex-none px-2 py-1 border-b border-divider flex gap-0.5 overflow-x-auto scrollbar-none">
            {CATEGORY_TABS.map(tab => {
              const count = tab.id === "all" ? total : (categories[tab.id] || 0);
              return (
                <button key={tab.id} onClick={() => { setCategory(tab.id); setSelectedIdx(0); }}
                  className={cn(
                    "px-2 py-1 rounded text-[9px] font-medium whitespace-nowrap transition-all",
                    category === tab.id ? "bg-purple-50 text-purple-600" : "text-text-tertiary hover:text-text-secondary hover:bg-hover"
                  )}>
                  {tab.label}
                  {count > 0 && <span className="ml-1 text-text-disabled">{formatCount(count)}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Stats + pagination */}
        <div className="flex-none px-3 py-1 border-b border-divider flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary">
            {loading ? "Loading..." : `${total.toLocaleString()} emails`}
            {archivedIds.size > 0 && <span className="text-text-disabled ml-1">({archivedIds.size} archived)</span>}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => { setPage(Math.max(1, page - 1)); setSelectedIdx(0); }} disabled={page <= 1}
                className="p-0.5 rounded hover:bg-hover disabled:opacity-30">
                <ChevronLeft className="w-3 h-3 text-text-tertiary" />
              </button>
              <span className="text-[8px] font-mono text-text-tertiary tabular-nums">{page}/{totalPages}</span>
              <button onClick={() => { setPage(Math.min(totalPages, page + 1)); setSelectedIdx(0); }} disabled={page >= totalPages}
                className="p-0.5 rounded hover:bg-hover disabled:opacity-30">
                <ChevronRight className="w-3 h-3 text-text-tertiary" />
              </button>
            </div>
          )}
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto" ref={listRef}>
          {error && (
            <div className="px-3 py-4 text-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-text-tertiary">{error}</p>
              <button onClick={refresh} className="text-xs text-purple-500 mt-1 hover:underline">Retry</button>
            </div>
          )}
          {loading && visibleEmails.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          )}
          {visibleEmails.map((email, idx) => {
            const isSelected = idx === selectedIdx;
            const isStarred = starredIds.has(email.id);
            const urg = URGENCY_BORDER[email.urgency] || URGENCY_BORDER.low;
            return (
              <button key={email.id} onClick={() => setSelectedIdx(idx)}
                className={cn(
                  "w-full text-left px-3 py-2 border-b border-divider border-l-2 transition-all group",
                  urg,
                  isSelected ? "bg-purple-50/60 border-l-purple-500" : "hover:bg-hover",
                  email.isUnread && !isSelected && "bg-blue-50/20",
                )}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <DirectionBadge dir={email.direction} />
                    <span className={cn("text-[11px] truncate", email.isUnread ? "font-semibold text-text-primary" : "text-text-secondary")}>
                      {email.from}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-none ml-2">
                    {isStarred && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                    <span className="text-[9px] text-text-tertiary">{email.timeAgo || email.date}</span>
                  </div>
                </div>
                <p className={cn("text-[10px] truncate", email.isUnread ? "text-text-primary" : "text-text-secondary")}>
                  {email.subject}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ActionBadge type={email.actionType} />
                  {email.dealNumbers?.length > 0 && (
                    <span className="text-[8px] font-mono text-purple-400">#{email.dealNumbers[0]}</span>
                  )}
                  {email.attachments > 0 && <Paperclip className="w-2.5 h-2.5 text-text-tertiary" />}
                  {email.ccCount > 0 && <span className="text-[7px] text-text-disabled">cc:{email.ccCount}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Thread / body view ─── */}
      {selectedEmail ? (
        <ThreadView
          email={selectedEmail}
          onViewThread={handleViewThread}
          onBack={() => setSelectedIdx(0)}
          starred={starredIds.has(selectedEmail.id)}
          onToggleStar={() => toggleStar(selectedEmail.id)}
          archived={archivedIds.has(selectedEmail.id)}
          onArchive={() => archiveEmail(selectedEmail.id)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <Inbox className="w-10 h-10 text-text-tertiary/40 mx-auto mb-3" />
            <p className="text-sm text-text-tertiary">{loading ? "Loading emails..." : "Select an email"}</p>
            <p className="text-[10px] text-text-disabled mt-1">j/k to navigate, Enter to open</p>
          </div>
        </div>
      )}

      {/* ─── Intelligence panel ─── */}
      {selectedEmail && (
        <div className="flex-none w-[300px] border-l border-divider overflow-y-auto p-3 space-y-3 bg-sidebar">
          <IntelPanel email={selectedEmail} />
        </div>
      )}
    </div>
  );
}
