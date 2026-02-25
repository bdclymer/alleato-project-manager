"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/queries";
import { createProject, updateProject, deleteProject } from "@/lib/mutations";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/Modal";
import { formatDate } from "@/lib/utils";

const emptyForm = { name: "", description: "", status: "Active", address: "", city: "", state: "", zip: "", start_date: "", end_date: "" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = () => getProjects().then((p) => { setProjects(p); setLoading(false); });
  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      name: row.name || "", description: row.description || "", status: row.status || "Active",
      address: row.address || "", city: row.city || "", state: row.state || "", zip: row.zip || "",
      start_date: row.start_date?.substring(0, 10) || "", end_date: row.end_date?.substring(0, 10) || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateProject(editing.id, form);
      else await createProject(form);
      setModalOpen(false);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project and all its related records?")) return;
    setDeleting(id);
    try { await deleteProject(id); await reload(); } catch (e: any) { alert("Error: " + e.message); }
    setDeleting(null);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Projects" count={projects.length} />
        <button onClick={openCreate} className={btnPrimary}>+ New Project</button>
      </div>
      <DataTable data={projects} searchField="name" columns={[
        { key: "name", header: "Project Name", render: (row) => <Link href={`/projects/${row.id}`} className="text-brand-orange hover:underline font-medium">{row.name || "Untitled"}</Link> },
        { key: "city", header: "Location", render: (row) => [row.city, row.state].filter(Boolean).join(", ") || "\u2014" },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
        { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
        { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) },
        { key: "actions", header: "", render: (row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="text-xs text-brand-orange hover:underline">Edit</button>
            <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id} className="text-xs text-red-500 hover:underline">{deleting === row.id ? "..." : "Delete"}</button>
          </div>
        )},
      ]} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Project" : "New Project"}>
        <FormField label="Project Name"><input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} /></FormField>
        <FormField label="Status">
          <select className={selectClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option>Active</option><option>READY</option><option>Completed</option><option>On Hold</option><option>Draft</option>
          </select>
        </FormField>
        <FormField label="Description"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Address"><input className={inputClass} value={form.address} onChange={(e) => set("address", e.target.value)} /></FormField>
          <FormField label="City"><input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} /></FormField>
          <FormField label="State"><input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} /></FormField>
          <FormField label="ZIP"><input className={inputClass} value={form.zip} onChange={(e) => set("zip", e.target.value)} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date"><input type="date" className={inputClass} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></FormField>
          <FormField label="End Date"><input type="date" className={inputClass} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Project"}</button>
        </div>
      </Modal>
    </div>
  );
}
