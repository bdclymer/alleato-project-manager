"use client";

import { useEffect, useState } from "react";
import { getMeetingMinutes, getProjects } from "@/lib/queries";
import { createMeeting, updateMeeting, deleteMeeting } from "@/lib/mutations";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const emptyForm = { project_id: "", number: "", title: "", meeting_date: "", location: "", agenda: "", notes: "", status: "Draft" };

export default function MeetingMinutesPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = () => Promise.all([getMeetingMinutes(), getProjects()]).then(([d, p]) => { setData(d); setProjects(p); setLoading(false); });
  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      project_id: row.project_id || "", number: row.number || "", title: row.title || "",
      meeting_date: row.meeting_date?.substring(0, 10) || "", location: row.location || "",
      agenda: row.agenda || "", notes: row.notes || "", status: row.status || "Draft",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateMeeting(editing.id, form);
      else await createMeeting(form);
      setModalOpen(false);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    setDeleting(id);
    try { await deleteMeeting(id); await reload(); } catch (e: any) { alert("Error: " + e.message); }
    setDeleting(null);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Meeting Minutes" count={data.length} />
        <button onClick={openCreate} className={btnPrimary}>+ New Meeting</button>
      </div>
      <DataTable data={data} searchField="title" columns={[
        { key: "number", header: "#", className: "w-16" },
        { key: "title", header: "Title", render: (r) => (
          <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-left text-brand-orange hover:underline font-medium">
            {r.title || "Untitled Meeting"}
          </button>
        )},
        { key: "project", header: "Project", render: (r) => <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">{(r as any).projects?.name || r.project_id}</Link> },
        { key: "meeting_date", header: "Date", render: (r) => formatDate(r.meeting_date) },
        { key: "location", header: "Location" },
        { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(r)} className="text-xs text-brand-orange hover:underline">Edit</button>
            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-xs text-red-500 hover:underline">{deleting === r.id ? "..." : "Delete"}</button>
          </div>
        )},
      ]} />

      {expanded && (() => {
        const m = data.find((d) => d.id === expanded);
        if (!m) return null;
        return (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-brand-navy mb-3">{m.title}</h3>
            {m.agenda && <div className="mb-4"><h4 className="text-sm font-medium text-gray-500 mb-1">Agenda / Description</h4><p className="text-sm whitespace-pre-wrap">{m.agenda}</p></div>}
            {m.notes && <div className="mb-4"><h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4><p className="text-sm whitespace-pre-wrap">{m.notes}</p></div>}
            {m.action_items && Array.isArray(m.action_items) && m.action_items.length > 0 && (
              <div><h4 className="text-sm font-medium text-gray-500 mb-1">Action Items</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {m.action_items.map((ai: any, i: number) => <li key={i}>{ai.title || ai.body || JSON.stringify(ai)}</li>)}
                </ul>
              </div>
            )}
            <button onClick={() => setExpanded(null)} className="mt-4 text-sm text-brand-orange hover:underline">Close</button>
          </div>
        );
      })()}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Meeting" : "New Meeting"}>
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
              <option>Draft</option><option>In Progress</option><option>Closed</option>
            </select>
          </FormField>
        </div>
        <FormField label="Title"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Meeting Date"><input type="date" className={inputClass} value={form.meeting_date} onChange={(e) => set("meeting_date", e.target.value)} /></FormField>
          <FormField label="Location"><input className={inputClass} value={form.location} onChange={(e) => set("location", e.target.value)} /></FormField>
        </div>
        <FormField label="Agenda"><textarea className={inputClass} rows={3} value={form.agenda} onChange={(e) => set("agenda", e.target.value)} /></FormField>
        <FormField label="Notes"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></FormField>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Meeting"}</button>
        </div>
      </Modal>
    </div>
  );
}
