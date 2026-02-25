"use client";

import { useEffect, useState } from "react";
import { getSubmittals, getProjects } from "@/lib/queries";
import { createSubmittal, updateSubmittal, deleteSubmittal } from "@/lib/mutations";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const emptyForm = { project_id: "", number: "", title: "", description: "", status: "Open", spec_section: "", submitted_by: "", assigned_to: "", due_date: "" };

export default function SubmittalsPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = () => Promise.all([getSubmittals(), getProjects()]).then(([d, p]) => { setData(d); setProjects(p); setLoading(false); });
  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      project_id: row.project_id || "", number: row.number || "", title: row.title || "",
      description: row.description || "", status: row.status || "Open", spec_section: row.spec_section || "",
      submitted_by: row.submitted_by || "", assigned_to: row.assigned_to || "",
      due_date: row.due_date?.substring(0, 10) || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateSubmittal(editing.id, form);
      else await createSubmittal(form);
      setModalOpen(false);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this submittal?")) return;
    setDeleting(id);
    try { await deleteSubmittal(id); await reload(); } catch (e: any) { alert("Error: " + e.message); }
    setDeleting(null);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Submittals" count={data.length} />
        <button onClick={openCreate} className={btnPrimary}>+ New Submittal</button>
      </div>
      <DataTable data={data} searchField="title" columns={[
        { key: "number", header: "#", className: "w-20" },
        { key: "title", header: "Title" },
        { key: "project", header: "Project", render: (r) => <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">{(r as any).projects?.name || r.project_id}</Link> },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "spec_section", header: "Spec Section" },
        { key: "assigned_to", header: "Assigned To" },
        { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(r)} className="text-xs text-brand-orange hover:underline">Edit</button>
            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-xs text-red-500 hover:underline">{deleting === r.id ? "..." : "Delete"}</button>
          </div>
        )},
      ]} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Submittal" : "New Submittal"}>
        <FormField label="Project">
          <select className={selectClass} value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Number"><input className={inputClass} value={form.number} onChange={(e) => set("number", e.target.value)} /></FormField>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option>Draft</option><option>Open</option><option>Approved</option><option>Rejected</option><option>Revise &amp; Resubmit</option>
            </select>
          </FormField>
        </div>
        <FormField label="Title"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></FormField>
        <FormField label="Description"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Spec Section"><input className={inputClass} value={form.spec_section} onChange={(e) => set("spec_section", e.target.value)} /></FormField>
          <FormField label="Submitted By"><input className={inputClass} value={form.submitted_by} onChange={(e) => set("submitted_by", e.target.value)} /></FormField>
          <FormField label="Assigned To"><input className={inputClass} value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} /></FormField>
          <FormField label="Due Date"><input type="date" className={inputClass} value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Submittal"}</button>
        </div>
      </Modal>
    </div>
  );
}
