"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { createProject } from "@/lib/mutations";

const PROJECT_TYPES = ["Commercial", "Industrial", "Infrastructure", "Residential", "Healthcare", "Education", "Other"];
const PROJECT_STAGES = ["Preconstruction", "Bidding", "Course of Construction", "Substantial Completion", "Closeout", "Warranty", "Completed"];
const STATUS_FILTERS = ["Active", "All", "Completed", "On Hold", "Draft"];

const emptyForm = {
  name: "", number: "", address: "", city: "", state: "", zip: "",
  project_type: "Commercial", stage: "Course of Construction",
  status: "Active", project_manager: "", superintendent: "",
  contract_value: "", start_date: "", end_date: "",
};

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createProject({
        ...form,
        contract_value: form.contract_value ? parseFloat(form.contract_value) : null,
      });
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === "All" || (p.status || "Active") === statusFilter;
    const matchesSearch = !search ||
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.number || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Home</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        </div>
        <button
          onClick={() => { setForm(emptyForm); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Create Project
        </button>
      </div>

      {/* Tab */}
      <div className="flex border-b border-gray-200 mb-5">
        <span className="px-4 py-2 text-sm font-semibold text-brand-orange border-b-2 border-brand-orange">Portfolio</span>
      </div>

      {/* Projects List header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-brand-navy">Projects List</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-48 focus:outline-none focus:border-brand-orange"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Status filter */}
            <div className="relative">
              <select
                className="pl-3 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-brand-orange"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Project Name", "Number", "Address", "Stage", "Project Type", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {projects.length === 0 ? "No projects yet. Create your first project." : "No projects match your search."}
                </td>
              </tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <Link href={`/projects/${p.id}`} className="text-brand-orange hover:underline font-medium">
                    {p.name || "Untitled"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{p.number || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {[p.address, p.city, p.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {p.stage ? (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{p.stage}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.project_type || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status || "Active"} /></td>
                <td className="px-4 py-3">
                  <Link href={`/projects/${p.id}`} className="text-xs text-brand-orange hover:underline font-medium">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {filtered.length} of {projects.length} projects
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Project" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Name *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Number</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 24-101" value={form.number} onChange={(e) => set("number", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Type</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Stage</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.stage} onChange={(e) => set("stage", e.target.value)}>
                {PROJECT_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Address</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. TN" value={form.state} onChange={(e) => set("state", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">ZIP</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.zip} onChange={(e) => set("zip", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Manager</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.project_manager} onChange={(e) => set("project_manager", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Superintendent</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.superintendent} onChange={(e) => set("superintendent", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Contract Value ($)</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.contract_value} onChange={(e) => set("contract_value", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option>Active</option><option>Draft</option><option>On Hold</option><option>Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.name} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
