"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";

interface PortfolioProject {
  id: string;
  name: string;
  status: string;
  stage: string;
  city: string;
  state: string;
  project_manager: string;
  contract_value: number;
  start_date: string;
  end_date: string;
}

interface PortfolioStats {
  totalProjects: number;
  activeProjects: number;
  totalValue: number;
  openRFIs: number;
  openSubmittals: number;
  openPunchItems: number;
  openIncidents: number;
  projects: PortfolioProject[];
}

export default function PortfolioPage() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);

  useEffect(() => {
    async function load() {
      const [projects, rfis, submittals, punchItems, incidents] = await Promise.all([
        supabase.from("projects").select("*").order("updated_at", { ascending: false }),
        supabase.from("rfis").select("id", { count: "exact", head: true }).in("status", ["open", "Open"]),
        supabase.from("submittals").select("id", { count: "exact", head: true }).in("status", ["open", "Open"]),
        supabase.from("punch_list_items").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("incidents").select("id", { count: "exact", head: true }).in("status", ["reported", "investigating"]),
      ]);

      const projectList = projects.data || [];
      const activeCount = projectList.filter((p: any) => p.status === "Active" || p.status === "active").length;
      const totalValue = projectList.reduce((sum: number, p: any) => sum + (p.contract_value || 0), 0);

      setStats({
        totalProjects: projectList.length,
        activeProjects: activeCount,
        totalValue,
        openRFIs: rfis.count || 0,
        openSubmittals: submittals.count || 0,
        openPunchItems: punchItems.count || 0,
        openIncidents: incidents.count || 0,
        projects: projectList,
      });
    }
    load();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Projects", value: stats.totalProjects, color: "text-brand-navy" },
    { label: "Active Projects", value: stats.activeProjects, color: "text-green-600" },
    { label: "Portfolio Value", value: formatCurrency(stats.totalValue), color: "text-brand-orange" },
    { label: "Open RFIs", value: stats.openRFIs, color: "text-amber-600" },
    { label: "Open Submittals", value: stats.openSubmittals, color: "text-blue-600" },
    { label: "Open Punch Items", value: stats.openPunchItems, color: "text-purple-600" },
    { label: "Open Incidents", value: stats.openIncidents, color: "text-red-600" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Portfolio</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Cross-project dashboard with KPIs and status overview.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Project Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-brand-navy">All Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PM</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/projects/${p.id}`} className="text-brand-orange hover:underline font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{[p.city, p.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-sm">{p.project_manager || "—"}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(p.contract_value)}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={p.stage} /></td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {stats.projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No projects yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
