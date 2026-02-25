"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listRecords, createRecord } from "@/lib/crud";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { FormField } from "@/components/FormField";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FieldDef } from "@/lib/types";

const PROJECT_FIELDS: FieldDef[] = [
  { key: "name", label: "Project Name", type: "text", required: true, span: 2 },
  { key: "number", label: "Project Number", type: "text" },
  { key: "status", label: "Status", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "bidding", label: "Bidding" },
    { value: "preconstruction", label: "Preconstruction" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "closed", label: "Closed" },
  ], defaultValue: "active" },
  { key: "stage", label: "Stage", type: "select", options: [
    { value: "active", label: "Active" },
    { value: "planning", label: "Planning" },
    { value: "construction", label: "Construction" },
    { value: "closeout", label: "Closeout" },
    { value: "warranty", label: "Warranty" },
  ], defaultValue: "active" },
  { key: "project_type", label: "Project Type", type: "select", options: [
    { value: "commercial", label: "Commercial" },
    { value: "residential", label: "Residential" },
    { value: "industrial", label: "Industrial" },
    { value: "institutional", label: "Institutional" },
    { value: "infrastructure", label: "Infrastructure" },
    { value: "renovation", label: "Renovation" },
  ] },
  { key: "region", label: "Region", type: "text" },
  { key: "address", label: "Address", type: "text", span: 2 },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "zip", label: "ZIP", type: "text" },
  { key: "contract_value", label: "Contract Value", type: "currency" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "project_manager", label: "Project Manager", type: "text" },
  { key: "superintendent", label: "Superintendent", type: "text" },
  { key: "owner_name", label: "Owner", type: "text" },
  { key: "architect_name", label: "Architect", type: "text" },
  { key: "description", label: "Description", type: "textarea", span: 2 },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({ status: "active", stage: "active" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await listRecords("projects", { orderBy: "updated_at", ascending: false });
      setProjects(data);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  }

  const filtered = projects.filter((p) => {
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status?.toLowerCase() !== filterStatus) return false;
    if (filterType && p.project_type !== filterType) return false;
    return true;
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      const id = "proj-" + Date.now();
      await createRecord("projects", { id, ...formData });
      setModalOpen(false);
      setFormData({ status: "active", stage: "active" });
      await loadProjects();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Projects</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="bidding">Bidding</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
        >
          <option value="">All Types</option>
          <option value="commercial">Commercial</option>
          <option value="residential">Residential</option>
          <option value="industrial">Industrial</option>
          <option value="institutional">Institutional</option>
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">
          {filtered.length} of {projects.length} projects
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-orange/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors truncate pr-2">
                  {p.name}
                </h3>
                <StatusBadge status={p.status} />
              </div>
              {p.number && <p className="text-xs text-gray-400 mb-2">#{p.number}</p>}
              <div className="text-xs text-gray-500 space-y-1">
                {p.city && <p>{[p.city, p.state].filter(Boolean).join(", ")}</p>}
                {p.project_manager && <p>PM: {p.project_manager}</p>}
                {p.contract_value && <p className="font-medium">{formatCurrency(p.contract_value)}</p>}
                <p className="text-gray-400">
                  {formatDate(p.start_date)} — {formatDate(p.end_date)}
                </p>
              </div>
              {p.project_type && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
                    {p.project_type}
                  </span>
                </div>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 text-sm">
              No projects found.
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project" wide>
        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="grid grid-cols-2 gap-4">
            {PROJECT_FIELDS.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={(k, v) => setFormData((prev) => ({ ...prev, [k]: v }))}
              />
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
