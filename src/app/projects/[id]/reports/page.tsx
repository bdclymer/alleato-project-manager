"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ReportData {
  title: string;
  category: string;
  loading: boolean;
  data: any;
}

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  generate: (projectId: string) => Promise<any>;
}

async function fetchFinancialSummary(projectId: string) {
  const { data: budgets } = await supabase
    .from("budgets")
    .select("original_amount, revised_amount, committed_amount, actual_amount, variance, category")
    .eq("project_id", projectId);

  const rows = budgets || [];
  const totals = rows.reduce(
    (acc, b) => ({
      original: acc.original + Number(b.original_amount || 0),
      revised: acc.revised + Number(b.revised_amount || 0),
      committed: acc.committed + Number(b.committed_amount || 0),
      actual: acc.actual + Number(b.actual_amount || 0),
      variance: acc.variance + Number(b.variance || 0),
    }),
    { original: 0, revised: 0, committed: 0, actual: 0, variance: 0 }
  );

  const byCategory: Record<string, number> = {};
  rows.forEach((b) => {
    const cat = b.category || "Uncategorized";
    byCategory[cat] = (byCategory[cat] || 0) + Number(b.actual_amount || 0);
  });

  return { totals, lineItems: rows.length, byCategory };
}

async function fetchScheduleStatus(projectId: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("start_date, end_date, status")
    .eq("id", projectId)
    .single();

  const now = new Date();
  const start = project?.start_date ? new Date(project.start_date) : null;
  const end = project?.end_date ? new Date(project.end_date) : null;

  let percentComplete = 0;
  let daysRemaining = 0;
  if (start && end) {
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    percentComplete = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const { count: openPunch } = await supabase
    .from("punch_list_items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .in("status", ["open", "in_progress"]);

  return {
    status: project?.status || "Unknown",
    percentComplete,
    daysRemaining,
    startDate: project?.start_date,
    endDate: project?.end_date,
    openPunchItems: openPunch || 0,
  };
}

async function fetchSafetyDashboard(projectId: string) {
  const [incidents, inspections, observations] = await Promise.all([
    supabase.from("incidents").select("id, status", { count: "exact" })
      .eq("project_id", projectId),
    supabase.from("inspections").select("id, status", { count: "exact" })
      .eq("project_id", projectId),
    supabase.from("observations").select("id, status", { count: "exact" })
      .eq("project_id", projectId),
  ]);

  return {
    totalIncidents: incidents.count || 0,
    totalInspections: inspections.count || 0,
    totalObservations: observations.count || 0,
    openIssues: (incidents.data || []).filter((i) => i.status === "reported" || i.status === "investigating").length +
      (inspections.data || []).filter((i) => i.status === "scheduled" || i.status === "in_progress").length +
      (observations.data || []).filter((o) => o.status === "open").length,
  };
}

async function fetchRfiStatus(projectId: string) {
  const { data: rfis } = await supabase
    .from("rfis")
    .select("id, status, due_date, created_at, responded_date")
    .eq("project_id", projectId);

  const rows = rfis || [];
  const byStatus: Record<string, number> = {};
  let overdue = 0;
  let totalResponseDays = 0;
  let responded = 0;

  rows.forEach((r) => {
    const s = r.status || "unknown";
    byStatus[s] = (byStatus[s] || 0) + 1;
    if (r.due_date && new Date(r.due_date) < new Date() && s !== "closed" && s !== "answered") {
      overdue++;
    }
    if (r.responded_date && r.created_at) {
      const days = (new Date(r.responded_date).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
      totalResponseDays += days;
      responded++;
    }
  });

  return {
    total: rows.length,
    byStatus,
    overdue,
    avgResponseDays: responded > 0 ? Math.round(totalResponseDays / responded) : 0,
  };
}

async function fetchSubmittalLog(projectId: string) {
  const { data: submittals } = await supabase
    .from("submittals")
    .select("id, status, due_date, approved_date, created_at, spec_section")
    .eq("project_id", projectId);

  const rows = submittals || [];
  const byStatus: Record<string, number> = {};
  let overdue = 0;

  rows.forEach((s) => {
    const st = s.status || "unknown";
    byStatus[st] = (byStatus[st] || 0) + 1;
    if (s.due_date && new Date(s.due_date) < new Date() && st !== "approved" && st !== "closed") {
      overdue++;
    }
  });

  return { total: rows.length, byStatus, overdue };
}

async function fetchChangeOrderSummary(projectId: string) {
  const [ccos, ctcos] = await Promise.all([
    supabase.from("commitment_change_orders")
      .select("id, status, amount")
      .eq("project_id", projectId),
    supabase.from("contract_change_orders")
      .select("id, status, amount")
      .eq("project_id", projectId),
  ]);

  const commitmentCOs = ccos.data || [];
  const contractCOs = ctcos.data || [];

  const commitmentTotal = commitmentCOs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const contractTotal = contractCOs.reduce((s, c) => s + Number(c.amount || 0), 0);

  const ccoByStatus: Record<string, number> = {};
  commitmentCOs.forEach((c) => { ccoByStatus[c.status || "unknown"] = (ccoByStatus[c.status || "unknown"] || 0) + 1; });

  const ctcoByStatus: Record<string, number> = {};
  contractCOs.forEach((c) => { ctcoByStatus[c.status || "unknown"] = (ctcoByStatus[c.status || "unknown"] || 0) + 1; });

  return {
    commitmentCOs: { count: commitmentCOs.length, total: commitmentTotal, byStatus: ccoByStatus },
    contractCOs: { count: contractCOs.length, total: contractTotal, byStatus: ctcoByStatus },
    netChange: commitmentTotal + contractTotal,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function StatusPill({ label, count }: { label: string; count: number }) {
  const colors: Record<string, string> = {
    open: "bg-amber-100 text-amber-800",
    closed: "bg-green-100 text-green-800",
    answered: "bg-green-100 text-green-800",
    approved: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    draft: "bg-gray-100 text-gray-600",
    rejected: "bg-red-100 text-red-800",
    void: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[label] || "bg-gray-100 text-gray-600"}`}>
      {label}: {count}
    </span>
  );
}

function ReportResult({ data, title }: { data: any; title: string }) {
  if (!data) return null;

  switch (title) {
    case "Financial Summary":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Original Budget</p>
              <p className="text-lg font-bold text-brand-navy">{formatCurrency(data.totals.original)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Actual Costs</p>
              <p className="text-lg font-bold text-brand-navy">{formatCurrency(data.totals.actual)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Committed</p>
              <p className="text-lg font-bold text-brand-navy">{formatCurrency(data.totals.committed)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Variance</p>
              <p className={`text-lg font-bold ${data.totals.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(data.totals.variance)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{data.lineItems} budget line items across {Object.keys(data.byCategory).length} categories</p>
        </div>
      );

    case "Schedule Status":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-1 bg-brand-orange/10 text-brand-orange text-xs font-medium rounded-full">{data.status}</span>
            <span className="text-xs text-gray-500">{data.daysRemaining} days remaining</span>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{data.percentComplete}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-brand-orange h-2.5 rounded-full transition-all" style={{ width: `${data.percentComplete}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-400">Start:</span> <span className="text-gray-600">{data.startDate ? new Date(data.startDate).toLocaleDateString() : "—"}</span></div>
            <div><span className="text-gray-400">End:</span> <span className="text-gray-600">{data.endDate ? new Date(data.endDate).toLocaleDateString() : "—"}</span></div>
          </div>
          <p className="text-xs text-gray-400">{data.openPunchItems} open punch list items</p>
        </div>
      );

    case "Safety Dashboard":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">{data.totalIncidents}</p>
              <p className="text-[10px] text-gray-400">Incidents</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">{data.totalInspections}</p>
              <p className="text-[10px] text-gray-400">Inspections</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-brand-navy">{data.totalObservations}</p>
              <p className="text-[10px] text-gray-400">Observations</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold ${data.openIssues > 0 ? "text-red-600" : "text-green-600"}`}>{data.openIssues}</p>
              <p className="text-[10px] text-gray-400">Open Issues</p>
            </div>
          </div>
        </div>
      );

    case "RFI Status":
      return (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-brand-navy">{data.total}</span>
            <span className="text-sm text-gray-400">total RFIs</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.byStatus).map(([k, v]) => <StatusPill key={k} label={k} count={v as number} />)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-400">Overdue:</span> <span className={data.overdue > 0 ? "text-red-600 font-semibold" : "text-gray-600"}>{data.overdue}</span></div>
            <div><span className="text-gray-400">Avg Response:</span> <span className="text-gray-600">{data.avgResponseDays} days</span></div>
          </div>
        </div>
      );

    case "Submittal Log":
      return (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-brand-navy">{data.total}</span>
            <span className="text-sm text-gray-400">total submittals</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.byStatus).map(([k, v]) => <StatusPill key={k} label={k} count={v as number} />)}
          </div>
          <p className="text-xs text-gray-400">{data.overdue} overdue items</p>
        </div>
      );

    case "Change Order Summary":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Commitment COs</p>
              <p className="text-lg font-bold text-brand-navy">{data.commitmentCOs.count}</p>
              <p className="text-xs text-gray-500">{formatCurrency(data.commitmentCOs.total)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Contract COs</p>
              <p className="text-lg font-bold text-brand-navy">{data.contractCOs.count}</p>
              <p className="text-xs text-gray-500">{formatCurrency(data.contractCOs.total)}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Net Change Impact</p>
            <p className={`text-xl font-bold ${data.netChange >= 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(data.netChange)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.commitmentCOs.byStatus).map(([k, v]) => <StatusPill key={`cco-${k}`} label={k} count={v as number} />)}
          </div>
        </div>
      );

    default:
      return <pre className="text-xs text-gray-500 overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>;
  }
}

const reports: ReportCard[] = [
  {
    title: "Financial Summary",
    description: "Budget vs actual costs, committed amounts, and variance analysis for this project.",
    category: "Financial",
    generate: fetchFinancialSummary,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "Schedule Status",
    description: "Milestone completion, critical path items, and schedule variance.",
    category: "Schedule",
    generate: fetchScheduleStatus,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </svg>
    ),
  },
  {
    title: "Safety Dashboard",
    description: "Incidents, inspection results, observations, and safety trends for this project.",
    category: "Safety",
    generate: fetchSafetyDashboard,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "RFI Status",
    description: "Open, closed, and overdue RFIs with aging analysis and response metrics.",
    category: "Project Controls",
    generate: fetchRfiStatus,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    title: "Submittal Log",
    description: "Submittal status overview, review timelines, and outstanding items.",
    category: "Project Controls",
    generate: fetchSubmittalLog,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    title: "Change Order Summary",
    description: "All commitment and contract change orders with approval status and cost impact.",
    category: "Financial",
    generate: fetchChangeOrderSummary,
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function ProjectReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [generating, setGenerating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGenerate = async (report: ReportCard) => {
    setGenerating(report.title);
    setErrors((prev) => { const next = { ...prev }; delete next[report.title]; return next; });
    try {
      const data = await report.generate(id);
      setResults((prev) => ({ ...prev, [report.title]: data }));
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [report.title]: e.message || "Failed to generate report" }));
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    for (const report of reports) {
      await handleGenerate(report);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Project Reports</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
          <p className="text-sm text-gray-500 mt-3">
            Generate and view reports for this project. Data is pulled live from Supabase.
          </p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating !== null}
          className="px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            "Generate All"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-navy/5 rounded-lg text-brand-navy">
                {report.icon}
              </div>
              <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-full">
                {report.category}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-brand-navy mb-2">{report.title}</h3>

            {results[report.title] ? (
              <div className="flex-1 mb-4">
                <ReportResult data={results[report.title]} title={report.title} />
              </div>
            ) : errors[report.title] ? (
              <div className="flex-1 mb-4">
                <p className="text-sm text-red-500">{errors[report.title]}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 flex-1 mb-6">{report.description}</p>
            )}

            <button
              onClick={() => handleGenerate(report)}
              disabled={generating === report.title}
              className="w-full px-4 py-2.5 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating === report.title ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : results[report.title] ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                  </svg>
                  Refresh
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
