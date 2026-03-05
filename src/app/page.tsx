"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const TOOL_SECTIONS = [
  {
    title: "Project Management",
    color: "bg-blue-50 border-blue-100",
    titleColor: "text-blue-800",
    tools: [
      { label: "Portfolio", href: "/portfolio", desc: "All projects overview" },
      { label: "Projects", href: "/projects", desc: "Manage active jobs" },
      { label: "Schedule", href: "/company-schedule", desc: "Project timelines" },
      { label: "Timecards", href: "/timecards", desc: "Labor tracking" },
    ],
  },
  {
    title: "Field Tools",
    color: "bg-orange-50 border-orange-100",
    titleColor: "text-orange-800",
    tools: [
      { label: "RFIs", href: "/rfis", desc: "Requests for information" },
      { label: "Submittals", href: "/submittals", desc: "Shop drawings & data" },
      { label: "Daily Logs", href: "/projects", desc: "Site activity logs" },
      { label: "Change Orders", href: "/change-orders", desc: "Contract changes" },
    ],
  },
  {
    title: "Financial Management",
    color: "bg-green-50 border-green-100",
    titleColor: "text-green-800",
    tools: [
      { label: "Budgets", href: "/budgets", desc: "Project cost tracking" },
      { label: "Payments", href: "/payments", desc: "Invoices & pay apps" },
      { label: "ERP Integrations", href: "/erp", desc: "Accounting sync" },
      { label: "Reports", href: "/reports", desc: "Financial reports" },
    ],
  },
  {
    title: "Quality & Safety",
    color: "bg-red-50 border-red-100",
    titleColor: "text-red-800",
    tools: [
      { label: "Incidents", href: "/incidents", desc: "Safety incident log" },
      { label: "Inspections", href: "/inspections", desc: "Site inspections" },
      { label: "Observations", href: "/observations", desc: "Field observations" },
      { label: "Action Plans", href: "/action-plans", desc: "Corrective actions" },
    ],
  },
  {
    title: "Company Tools",
    color: "bg-purple-50 border-purple-100",
    titleColor: "text-purple-800",
    tools: [
      { label: "Directory", href: "/directory", desc: "Contacts & companies" },
      { label: "Documents", href: "/company-documents", desc: "Company files" },
      { label: "Workflows", href: "/workflows", desc: "Process automation" },
      { label: "Analytics", href: "/analytics", desc: "Business insights" },
    ],
  },
  {
    title: "Preconstruction",
    color: "bg-yellow-50 border-yellow-100",
    titleColor: "text-yellow-800",
    tools: [
      { label: "Bid Management", href: "/bids", desc: "Bidding & estimates" },
      { label: "Prequalification", href: "/prequalification", desc: "Sub vetting" },
      { label: "Planroom", href: "/planroom", desc: "Bid documents" },
      { label: "Cost Catalog", href: "/cost-catalog", desc: "Unit cost library" },
    ],
  },
];

export default function HomePage() {
  const [stats, setStats] = useState({ projects: 0, openRFIs: 0, openSubmittals: 0, openChangeEvents: 0 });

  useEffect(() => {
    async function load() {
      const [p, r, s, c] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("rfis").select("id", { count: "exact", head: true }).in("status", ["Open", "open", "Draft", "Under Review"]),
        supabase.from("submittals").select("id", { count: "exact", head: true }).in("status", ["Draft", "Submitted", "Under Review"]),
        supabase.from("change_events").select("id", { count: "exact", head: true }).in("status", ["Draft", "Pending", "Submitted"]),
      ]);
      setStats({ projects: p.count || 0, openRFIs: r.count || 0, openSubmittals: s.count || 0, openChangeEvents: c.count || 0 });
    }
    load();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">
              <span className="text-brand-orange">Alleato</span> Group
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Company Dashboard</p>
            <div className="w-12 h-1 bg-brand-orange rounded mt-2" />
          </div>
          <Link href="/projects" className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
            + Create Project
          </Link>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Projects", value: stats.projects, href: "/projects", color: "text-brand-navy" },
          { label: "Open RFIs", value: stats.openRFIs, href: "/rfis", color: "text-amber-600" },
          { label: "Pending Submittals", value: stats.openSubmittals, href: "/submittals", color: "text-blue-600" },
          { label: "Change Events", value: stats.openChangeEvents, href: "/change-orders", color: "text-red-600" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-orange/30 transition-colors shadow-sm">
            <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-1 font-medium">{kpi.label}</div>
          </Link>
        ))}
      </div>

      {/* Portfolio Quick Link */}
      <Link href="/portfolio" className="flex items-center justify-between bg-brand-navy text-white rounded-xl px-6 py-4 mb-8 hover:bg-brand-navy/90 transition-colors shadow-sm">
        <div>
          <p className="font-semibold">View Portfolio</p>
          <p className="text-xs text-gray-400 mt-0.5">Cross-project overview with KPIs and project list</p>
        </div>
        <svg className="w-5 h-5 text-brand-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </Link>

      {/* Tool Sections */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Company Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOL_SECTIONS.map((section) => (
          <div key={section.title} className={`rounded-xl border p-4 ${section.color}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${section.titleColor}`}>{section.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {section.tools.map((tool) => (
                <Link key={tool.href} href={tool.href} className="bg-white rounded-lg px-3 py-2 hover:shadow-sm transition-shadow border border-white hover:border-gray-200">
                  <p className="text-sm font-medium text-brand-navy">{tool.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
