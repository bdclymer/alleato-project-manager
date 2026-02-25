"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectCounts, getRFIs, getSubmittals, getBudgets, getCommitmentCOs, getContractCOs, getMeetingMinutes, getAttachments } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { formatDate, formatCurrency } from "@/lib/utils";

type Tab = "rfis" | "submittals" | "budgets" | "ccos" | "ctcos" | "meetings" | "attachments";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [counts, setCounts] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("rfis");
  const [tabData, setTabData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProject(id), getProjectCounts(id)]).then(([p, c]) => {
      setProject(p);
      setCounts(c);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const loaders: Record<Tab, () => Promise<any[]>> = {
      rfis: () => getRFIs(id),
      submittals: () => getSubmittals(id),
      budgets: () => getBudgets(id),
      ccos: () => getCommitmentCOs(id),
      ctcos: () => getContractCOs(id),
      meetings: () => getMeetingMinutes(id),
      attachments: () => getAttachments(id),
    };
    loaders[tab]().then(setTabData);
  }, [id, tab]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!project) return <div className="p-8">Project not found.</div>;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "rfis", label: "RFIs", count: counts?.rfis || 0 },
    { key: "submittals", label: "Submittals", count: counts?.submittals || 0 },
    { key: "budgets", label: "Budgets", count: counts?.budgets || 0 },
    { key: "ccos", label: "Commitment COs", count: counts?.commitmentCOs || 0 },
    { key: "ctcos", label: "Contract COs", count: counts?.contractCOs || 0 },
    { key: "meetings", label: "Meetings", count: counts?.meetings || 0 },
    { key: "attachments", label: "Attachments", count: counts?.attachments || 0 },
  ];

  return (
    <div>
      <Link href="/projects" className="text-sm text-brand-orange hover:underline mb-4 inline-block">&larr; All Projects</Link>
      <PageHeader title={project.name || "Project"} />

      {/* Project info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-400">Status:</span> <StatusBadge status={project.status} /></div>
          <div><span className="text-gray-400">Location:</span> {[project.address, project.city, project.state, project.zip].filter(Boolean).join(", ") || "—"}</div>
          <div><span className="text-gray-400">Start:</span> {formatDate(project.start_date)} — <span className="text-gray-400">End:</span> {formatDate(project.end_date)}</div>
        </div>
        {project.description && <p className="mt-3 text-sm text-gray-500">{project.description}</p>}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className="text-left">
            <StatCard label={t.label} value={t.count} />
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-brand-orange text-white" : "bg-white text-gray-500 hover:bg-gray-100"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "rfis" && (
        <DataTable data={tabData} searchField="subject" columns={[
          { key: "number", header: "#" },
          { key: "subject", header: "Subject" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "assigned_to", header: "Assigned To" },
          { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
        ]} />
      )}
      {tab === "submittals" && (
        <DataTable data={tabData} searchField="title" columns={[
          { key: "number", header: "#" },
          { key: "title", header: "Title" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "assigned_to", header: "Assigned To" },
          { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
        ]} />
      )}
      {tab === "budgets" && (
        <DataTable data={tabData} columns={[
          { key: "code", header: "Code" },
          { key: "description", header: "Description" },
          { key: "original_amount", header: "Original", render: (r) => formatCurrency(r.original_amount) },
          { key: "revised_amount", header: "Revised", render: (r) => formatCurrency(r.revised_amount) },
          { key: "committed_amount", header: "Committed", render: (r) => formatCurrency(r.committed_amount) },
          { key: "variance", header: "Variance", render: (r) => formatCurrency(r.variance) },
        ]} />
      )}
      {tab === "ccos" && (
        <DataTable data={tabData} searchField="title" columns={[
          { key: "number", header: "#" },
          { key: "title", header: "Title" },
          { key: "vendor", header: "Vendor" },
          { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]} />
      )}
      {tab === "ctcos" && (
        <DataTable data={tabData} searchField="title" columns={[
          { key: "number", header: "#" },
          { key: "title", header: "Title" },
          { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "approved_date", header: "Approved", render: (r) => formatDate(r.approved_date) },
        ]} />
      )}
      {tab === "meetings" && (
        <DataTable data={tabData} searchField="title" columns={[
          { key: "number", header: "#" },
          { key: "title", header: "Title" },
          { key: "meeting_date", header: "Date", render: (r) => formatDate(r.meeting_date) },
          { key: "location", header: "Location" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]} />
      )}
      {tab === "attachments" && (
        <DataTable data={tabData} searchField="name" columns={[
          { key: "name", header: "Name", render: (r) => r.file_url ? <a href={r.file_url} target="_blank" rel="noopener" className="text-brand-orange hover:underline">{r.name || r.file_name}</a> : (r.name || r.file_name || "—") },
          { key: "category", header: "Folder" },
          { key: "file_size", header: "Size", render: (r) => r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : "—" },
        ]} />
      )}
    </div>
  );
}
