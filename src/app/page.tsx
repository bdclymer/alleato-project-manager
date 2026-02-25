"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  projectCount: number;
  rfiCount: number;
  submittalCount: number;
  budgetCount: number;
  ccoCount: number;
  ctcoCount: number;
  meetingCount: number;
  incidentCount: number;
  punchCount: number;
  inspectionCount: number;
  recentProjects: any[];
  openRFIs: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projects, rfis, submittals, budgets, ccos, ctcos, meetings, incidents, punchItems, inspections, recentProjects, openRFIs] =
          await Promise.all([
            supabase.from("projects").select("id", { count: "exact", head: true }),
            supabase.from("rfis").select("id", { count: "exact", head: true }),
            supabase.from("submittals").select("id", { count: "exact", head: true }),
            supabase.from("budgets").select("id", { count: "exact", head: true }),
            supabase.from("commitment_change_orders").select("id", { count: "exact", head: true }),
            supabase.from("contract_change_orders").select("id", { count: "exact", head: true }),
            supabase.from("meeting_minutes").select("id", { count: "exact", head: true }),
            supabase.from("incidents").select("id", { count: "exact", head: true }).in("status", ["reported", "investigating"]),
            supabase.from("punch_list_items").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
            supabase.from("inspections").select("id", { count: "exact", head: true }).in("status", ["scheduled", "in_progress"]),
            supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(5),
            supabase.from("rfis").select("*, projects(name)").in("status", ["open", "Open"]).order("created_at", { ascending: false }).limit(5),
          ]);

        setData({
          projectCount: projects.count || 0,
          rfiCount: rfis.count || 0,
          submittalCount: submittals.count || 0,
          budgetCount: budgets.count || 0,
          ccoCount: ccos.count || 0,
          ctcoCount: ctcos.count || 0,
          meetingCount: meetings.count || 0,
          incidentCount: incidents.count || 0,
          punchCount: punchItems.count || 0,
          inspectionCount: inspections.count || 0,
          recentProjects: recentProjects.data || [],
          openRFIs: openRFIs.data || [],
        });
      } catch {
        setData({
          projectCount: 0, rfiCount: 0, submittalCount: 0, budgetCount: 0,
          ccoCount: 0, ctcoCount: 0, meetingCount: 0, incidentCount: 0,
          punchCount: 0, inspectionCount: 0, recentProjects: [], openRFIs: [],
        });
      }
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

  const stats = [
    { label: "Projects", value: data.projectCount, href: "/projects" },
    { label: "RFIs", value: data.rfiCount, href: "/rfis" },
    { label: "Submittals", value: data.submittalCount, href: "/submittals" },
    { label: "Budget Lines", value: data.budgetCount, href: "/budgets" },
    { label: "Change Orders", value: data.ccoCount + data.ctcoCount, href: "/change-orders" },
    { label: "Meetings", value: data.meetingCount, href: "/meeting-minutes" },
    { label: "Open Incidents", value: data.incidentCount, href: "/incidents" },
    { label: "Open Punch Items", value: data.punchCount, href: "/projects" },
    { label: "Pending Inspections", value: data.inspectionCount, href: "/inspections" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
        <div className="mt-2 h-1 w-16 bg-brand-orange rounded" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-brand-orange/30 transition-colors">
            <div className="text-2xl font-bold text-brand-navy">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {data.recentProjects.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {data.recentProjects.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Open RFIs</h2>
          <div className="space-y-3">
            {data.openRFIs.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">#{r.number} &mdash; {r.subject}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{(r as any).projects?.name} &middot; Due {formatDate(r.due_date)}</p>
              </div>
            ))}
            {data.openRFIs.length === 0 && <p className="text-sm text-gray-400">No open RFIs.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
