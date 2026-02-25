"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
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
  recentProjects: any[];
  openRFIs: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const [projects, rfis, submittals, budgets, ccos, ctcos, meetings, recentProjects, openRFIs] =
        await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }),
          supabase.from("rfis").select("id", { count: "exact", head: true }),
          supabase.from("submittals").select("id", { count: "exact", head: true }),
          supabase.from("budgets").select("id", { count: "exact", head: true }),
          supabase.from("commitment_change_orders").select("id", { count: "exact", head: true }),
          supabase.from("contract_change_orders").select("id", { count: "exact", head: true }),
          supabase.from("meeting_minutes").select("id", { count: "exact", head: true }),
          supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(5),
          supabase.from("rfis").select("*, projects(name)").eq("status", "Open").order("created_at", { ascending: false }).limit(5),
        ]);

      setData({
        projectCount: projects.count || 0,
        rfiCount: rfis.count || 0,
        submittalCount: submittals.count || 0,
        budgetCount: budgets.count || 0,
        ccoCount: ccos.count || 0,
        ctcoCount: ctcos.count || 0,
        meetingCount: meetings.count || 0,
        recentProjects: recentProjects.data || [],
        openRFIs: openRFIs.data || [],
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

  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projects" value={data.projectCount} />
        <StatCard label="RFIs" value={data.rfiCount} />
        <StatCard label="Submittals" value={data.submittalCount} />
        <StatCard label="Budgets" value={data.budgetCount} />
        <StatCard label="Commitment COs" value={data.ccoCount} />
        <StatCard label="Contract COs" value={data.ctcoCount} />
        <StatCard label="Meetings" value={data.meetingCount} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {data.recentProjects.map((p: any) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">
                    {[p.city, p.state].filter(Boolean).join(", ")}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
            {data.recentProjects.length === 0 && (
              <p className="text-sm text-gray-400">No projects yet. Run the sync pipeline to populate data.</p>
            )}
          </div>
        </div>

        {/* Open RFIs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">Open RFIs</h2>
          <div className="space-y-3">
            {data.openRFIs.map((r: any) => (
              <div key={r.id} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">#{r.number} — {r.subject}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {(r as any).projects?.name} &middot; Due {formatDate(r.due_date)}
                </p>
              </div>
            ))}
            {data.openRFIs.length === 0 && (
              <p className="text-sm text-gray-400">No open RFIs.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
