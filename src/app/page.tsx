"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";

interface DashboardData {
  projectCount: number;
  rfiCount: number;
  submittalCount: number;
  openRFIs: number;
  openSubmittals: number;
  budgetTotal: number;
  incidentCount: number;
  punchOpenCount: number;
  recentProjects: any[];
  openRFIList: any[];
  activeIncidents: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          projects, rfis, submittals, openRfis, openSubs,
          incidents, punchOpen, recentProjects, openRFIList, activeIncidents
        ] = await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }),
          supabase.from("rfis").select("id", { count: "exact", head: true }),
          supabase.from("submittals").select("id", { count: "exact", head: true }),
          supabase.from("rfis").select("id", { count: "exact", head: true }).eq("status", "Open"),
          supabase.from("submittals").select("id", { count: "exact", head: true }).in("status", ["Open", "open"]),
          supabase.from("incidents").select("id", { count: "exact", head: true }),
          supabase.from("punch_list_items").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
          supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(8),
          supabase.from("rfis").select("*, projects(name)").eq("status", "Open").order("created_at", { ascending: false }).limit(5),
          supabase.from("incidents").select("*, projects(name)").in("status", ["reported", "investigating"]).order("created_at", { ascending: false }).limit(5),
        ]);

        setData({
          projectCount: projects.count || 0,
          rfiCount: rfis.count || 0,
          submittalCount: submittals.count || 0,
          openRFIs: openRfis.count || 0,
          openSubmittals: openSubs.count || 0,
          budgetTotal: 0,
          incidentCount: incidents.count || 0,
          punchOpenCount: punchOpen.count || 0,
          recentProjects: recentProjects.data || [],
          openRFIList: openRFIList.data || [],
          activeIncidents: activeIncidents.data || [],
        });
      } catch (e: any) {
        setError(e.message);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-brand-navy mb-1">Portfolio Dashboard</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mb-6" />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold text-amber-800 mb-2">Connection Issue</h2>
          <p className="text-sm text-amber-700 mb-4">
            Unable to connect to the database. The Supabase PostgREST schema cache may need reloading.
          </p>
          <p className="text-xs text-amber-600">
            Go to your Supabase Dashboard &rarr; Settings &rarr; API &rarr; Click &quot;Reload Schema&quot; to fix this.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Active Projects", value: data.projectCount, color: "bg-blue-500" },
    { label: "Open RFIs", value: data.openRFIs, color: "bg-amber-500" },
    { label: "Open Submittals", value: data.openSubmittals, color: "bg-purple-500" },
    { label: "Open Punch Items", value: data.punchOpenCount, color: "bg-red-500" },
    { label: "Total RFIs", value: data.rfiCount, color: "bg-cyan-500" },
    { label: "Total Submittals", value: data.submittalCount, color: "bg-teal-500" },
    { label: "Incidents", value: data.incidentCount, color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy mb-1">Portfolio Dashboard</h1>
      <div className="w-12 h-1 bg-brand-orange rounded mb-6" />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-2xl font-bold text-brand-navy">{s.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{s.label}</div>
            <div className={`w-full h-0.5 ${s.color} rounded mt-2 opacity-60`} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-navy">Projects</h2>
            <Link href="/projects" className="text-xs text-brand-orange hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {data.recentProjects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                    {p.project_manager && ` | PM: ${p.project_manager}`}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {data.recentProjects.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">No projects yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* Open RFIs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-brand-navy mb-3">Open RFIs</h2>
            <div className="space-y-2">
              {data.openRFIList.map((r: any) => (
                <div key={r.id} className="p-2 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-xs">#{r.number} — {r.subject}</p>
                  <p className="text-[11px] text-gray-400">
                    {r.projects?.name} &middot; Due {formatDate(r.due_date)}
                  </p>
                </div>
              ))}
              {data.openRFIList.length === 0 && (
                <p className="text-xs text-gray-400">No open RFIs</p>
              )}
            </div>
          </div>

          {/* Active Incidents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-brand-navy mb-3">Active Incidents</h2>
            <div className="space-y-2">
              {data.activeIncidents.map((inc: any) => (
                <div key={inc.id} className="p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs">{inc.title}</p>
                    <StatusBadge status={inc.severity} />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {inc.projects?.name} &middot; {formatDate(inc.incident_date)}
                  </p>
                </div>
              ))}
              {data.activeIncidents.length === 0 && (
                <p className="text-xs text-gray-400">No active incidents</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
