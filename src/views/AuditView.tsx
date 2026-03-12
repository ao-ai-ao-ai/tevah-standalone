import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, Shield, AlertTriangle, AlertCircle, Info, CheckCircle2, RefreshCw, DollarSign, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { Card } from "../components/card";
import { useAuditor, type AuditSummary, type AuditFinding } from "../lib/use-auditor";

const FINDING_LABELS: Record<string, string> = {
  missing_invoice: "Missing Invoice",
  missing_bill: "Missing Bill",
  amount_mismatch: "Amount Mismatch",
  margin_drift: "Margin Drift",
  ghost_invoice: "Ghost Invoice",
  duplicate_invoice: "Duplicate Invoice",
  payment_discrepancy: "Payment Discrepancy",
  payment_not_recorded: "Payment Not Recorded",
  overdue_confirmed: "Overdue Confirmed",
  vendor_unpaid: "Vendor Unpaid",
  stale_stage: "Stale Stage",
  delivered_not_invoiced: "Delivered Not Invoiced",
  invoiced_not_delivered: "Invoiced Not Delivered",
};

export function AuditView() {
  const { data: auditData, loading } = useAuditor();
  const summary = auditData?.summary ?? null;
  const findings = auditData?.findings ?? [];
  const error = !loading && !summary ? "Forensic auditor unavailable — check port 8901" : "";
  const [tab, setTab] = useState<"summary" | "findings" | "risk">("summary");
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning">("all");

  const runAudit = () => { window.location.reload(); };

  const filteredFindings = useMemo(() => {
    let list = findings;
    if (severityFilter !== "all") list = list.filter(f => f.severity === severityFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.deal_number.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.customer || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [findings, severityFilter, search]);

  const sevIcon = (s: string) => {
    if (s === "critical") return <AlertCircle className="w-3 h-3 text-red-500" />;
    if (s === "warning") return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    return <Info className="w-3 h-3 text-blue-500" />;
  };

  const sevCls = (s: string) =>
    s === "critical" ? "text-red-700 bg-red-50" :
    s === "warning" ? "text-amber-700 bg-amber-50" :
    "text-blue-700 bg-blue-50";

  if (error && !summary) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card variant="elevated" className="p-8 max-w-md text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-text-primary mb-1">Forensic Auditor Offline</h2>
          <p className="text-xs text-text-tertiary mb-4">{error}</p>
          <button onClick={runAudit} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
            Retry Connection
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none px-6 py-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-text-primary tracking-[-0.01em] flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Forensic Audit
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              {summary ? `${summary.total_deals} deals audited — ${summary.total_findings} findings — ${formatCurrency(summary.total_dollar_impact)} at risk` : "Loading..."}
              <span className="ml-2 text-[10px] text-text-disabled">QB: {summary?.qb_mode || "..."} ({summary?.qb_invoices_loaded || 0} invoices loaded)</span>
            </p>
          </div>
          <button onClick={runAudit} disabled={loading}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              loading ? "bg-canvas text-text-disabled" : "bg-purple-600 text-white hover:bg-purple-700"
            )}>
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            {loading ? "Auditing..." : "Re-Audit"}
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Avg Health Score", value: `${summary.avg_score}/100`, icon: Shield, color: summary.avg_score >= 80 ? "text-emerald-600" : summary.avg_score >= 60 ? "text-amber-600" : "text-red-600", iconBg: summary.avg_score >= 80 ? "bg-emerald-50" : summary.avg_score >= 60 ? "bg-amber-50" : "bg-red-50" },
              { label: "Critical Findings", value: summary.critical.toString(), icon: AlertCircle, color: "text-red-600", iconBg: "bg-red-50" },
              { label: "Warnings", value: summary.warnings.toString(), icon: AlertTriangle, color: "text-amber-600", iconBg: "bg-amber-50" },
              { label: "Dollar Impact", value: formatCurrency(summary.total_dollar_impact), icon: DollarSign, color: "text-red-600", iconBg: "bg-red-50" },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card variant="kpi" className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", m.iconBg)}>
                      <m.icon className={cn("w-3 h-3", m.color)} />
                    </div>
                    <span className="text-[9px] text-text-tertiary uppercase tracking-wider">{m.label}</span>
                  </div>
                  <p className={cn("text-lg font-bold tabular-nums", m.color)}>{m.value}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {(["summary", "findings", "risk"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                  tab === t ? "bg-purple-100 text-purple-700" : "text-text-tertiary hover:text-text-secondary hover:bg-white"
                )}>
                {t}
              </button>
            ))}
          </div>
          {tab === "findings" && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(["all", "critical", "warning"] as const).map(s => (
                  <button key={s} onClick={() => setSeverityFilter(s)}
                    className={cn("px-2 py-1 rounded text-[10px] font-medium transition-colors capitalize",
                      severityFilter === s ? "bg-purple-100 text-purple-700" : "text-text-tertiary hover:bg-white"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                  className="h-7 pl-7 pr-2 w-40 text-[11px] bg-white border border-divider rounded-md text-text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "summary" && summary && (
          <div className="grid grid-cols-2 gap-4">
            {/* Findings by Type */}
            <Card variant="standard" className="p-4">
              <h3 className="text-xs font-semibold text-text-primary mb-3">Findings by Type</h3>
              <div className="space-y-2">
                {Object.entries(summary.findings_by_type)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{FINDING_LABELS[type] || type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-canvas rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(summary.findings_by_type))) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-primary tabular-nums w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Worst Deals */}
            <Card variant="standard" className="p-4">
              <h3 className="text-xs font-semibold text-text-primary mb-3">Worst Health Scores</h3>
              <div className="space-y-2">
                {summary.worst_deals.map(d => (
                  <div key={d.deal} className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs font-mono text-text-secondary">#{d.deal}</span>
                      <span className="text-xs text-text-tertiary ml-2">{d.brand} &mdash; {d.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold tabular-nums",
                        d.score >= 80 ? "text-emerald-600" : d.score >= 50 ? "text-amber-600" : "text-red-600"
                      )}>{d.score}/100</span>
                      <span className="text-[10px] text-text-disabled">{d.findings} issues</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "findings" && (
          <Card variant="standard" className="overflow-hidden">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-divider">
                  {["Severity", "Deal", "Type", "Description", "Expected", "Actual", "Impact", "Action"].map(h => (
                    <th key={h} className="text-left font-medium text-text-tertiary text-[10px] uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-text-tertiary text-sm">No findings match your filters.</td></tr>
                )}
                {filteredFindings.slice(0, 100).map((f, i) => (
                  <motion.tr key={`${f.deal_number}-${f.finding_type}-${i}`}
                    initial={i < 30 ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    className="border-b border-divider hover:bg-hover transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", sevCls(f.severity))}>
                        {sevIcon(f.severity)}
                        {f.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-text-secondary">#{f.deal_number}</td>
                    <td className="px-3 py-2 text-text-secondary">{FINDING_LABELS[f.finding_type] || f.finding_type}</td>
                    <td className="px-3 py-2 text-text-primary max-w-[300px] truncate">{f.description}</td>
                    <td className="px-3 py-2 text-text-tertiary truncate max-w-[120px]">{f.expected}</td>
                    <td className="px-3 py-2 text-text-tertiary truncate max-w-[120px]">{f.actual}</td>
                    <td className="px-3 py-2 font-mono tabular-nums text-red-600">{f.amount_impact > 0 ? formatCurrency(f.amount_impact) : "--"}</td>
                    <td className="px-3 py-2 text-purple-600 truncate max-w-[180px]">{f.suggested_action}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "risk" && summary && (
          <Card variant="standard" className="p-4">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Customer Risk Assessment
            </h3>
            <div className="space-y-3">
              {summary.customer_risk.map(c => (
                <div key={c.customer} className="flex items-center gap-4 py-2 border-b border-divider last:border-0">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">{c.customer}</p>
                    <p className="text-[10px] text-text-tertiary">{c.findings} findings</p>
                  </div>
                  <div className="w-48">
                    <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (c.amount_at_risk / (summary.customer_risk[0]?.amount_at_risk || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-red-600 tabular-nums w-24 text-right">{formatCurrency(c.amount_at_risk)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AuditView;
