"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const [projects, rfis, submittals, incidents, punchItems, inspections, budgets] =
        await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("rfis").select("status"),
          supabase.from("submittals").select("status"),
          supabase.from("incidents").select("severity, status"),
          supabase.from("punch_list_items").select("status"),
          supabase.from("inspections").select("result, status"),
          supabase.from("budgets").select("original_amount, actual_amount"),
        ]);

      const rfiData = rfis.data || [];
      const submittalData = submittals.data || [];
      const incidentData = incidents.data || [];
      const punchData = punchItems.data || [];
      const inspData = inspections.data || [];
      const budgetData = budgets.data || [];

      setData({
        projectCount: (projects.data || []).length,
        totalValue: (projects.data || []).reduce((s: number, p: any) => s + (p.contract_value || 0), 0),
        rfis: { total: rfiData.length, open: rfiData.filter((r: any) => r.status === "open" || r.status === "Open").length },
        submittals: { total: submittalData.length, open: submittalData.filter((s: any) => s.status === "open" || s.status === "Open").length },
        incidents: { total: incidentData.length, open: incidentData.filter((i: any) => i.status === "reported" || i.status === "investigating").length },
        punchItems: { total: punchData.length, open: punchData.filter((p: any) => p.status === "open" || p.status === "in_progress").length },
        inspections: { total: inspData.length, passed: inspData.filter((i: any) => i.result === "pass").length },
        budget: { original: budgetData.reduce((s: number, b: any) => s + (b.original_amount || 0), 0), actual: budgetData.reduce((s: number, b: any) => s + (b.actual_amount || 0), 0) },
      });
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = [
    { label: "Total Projects", value: data.projectCount },
    { label: "Portfolio Value", value: formatCurrency(data.totalValue) },
    { label: "Open RFIs", value: `${data.rfis.open} / ${data.rfis.total}` },
    { label: "Open Submittals", value: `${data.submittals.open} / ${data.submittals.total}` },
    { label: "Open Incidents", value: `${data.incidents.open} / ${data.incidents.total}` },
    { label: "Open Punch Items", value: `${data.punchItems.open} / ${data.punchItems.total}` },
    { label: "Inspections Passed", value: `${data.inspections.passed} / ${data.inspections.total}` },
    { label: "Budget (Original)", value: formatCurrency(data.budget.original) },
    { label: "Budget (Actual)", value: formatCurrency(data.budget.actual) },
    { label: "Budget Variance", value: formatCurrency(data.budget.original - data.budget.actual) },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Analytics</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">Company-wide analytics and KPI dashboard.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-xl font-bold text-brand-navy">{m.value}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
