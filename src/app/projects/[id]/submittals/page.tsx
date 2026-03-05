"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/Modal";

const SUBMITTAL_STATUSES = ["Draft", "Submitted", "Under Review", "Approved", "Approved with Comments", "Revise & Resubmit", "Rejected"];
const SUBMITTAL_TYPES = ["Shop Drawing", "Product Data", "Sample", "Closeout", "O&M Manual", "Warranty", "Other"];
const emptyForm = { number: "", title: "", spec_section: "", type: "Shop Drawing", status: "Draft", revision: "0", submitted_by: "", due_date: "", reviewer: "", review_comments: "" };

export default function SubmittalsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [submittals, setSubmittals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    const { data } = await supabase.from("submittals").select("*").eq("project_id", projectId).order("number", { ascending: true });
    setSubmittals(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const openCreate = async () => {
    const { count } = await supabase.from("submittals").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    setForm({ ...emptyForm, number: String((count || 0) + 1) });
    setSelected(null);
    setModalOpen(true);
  };

  const openDetail = (s: any) => { setSelected(s); setDetailOpen(true); };
  const openEdit = (s: any) => {
    setSelected(s);
    setForm({ number: s.number || "", title: s.title || "", spec_section: s.spec_section || "", type: s.type || "Shop Drawing", status: s.status || "Draft", revision: s.revision !== undefined ? String(s.revision) : "0", submitted_by: s.submitted_by || "", due_date: s.due_date?.substring(0, 10) || "", reviewer: s.reviewer || "", review_comments: s.review_comments || "" });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, project_id: projectId, revision: parseInt(form.revision) || 0 };
      if (selected) await supabase.from("submittals").update(payload).eq("id", selected.id);
      else await supabase.from("submittals").insert(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const setStatus = async (submittal: any, status: string) => {
    const updateData: any = { status };
    if (status === "Revise & Resubmit") updateData.revision = (submittal.revision || 0) + 1;
    await supabase.from("submittals").update(updateData).eq("id", submittal.id);
    await load();
    if (selected?.id === submittal.id) setSelected({ ...submittal, ...updateData });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const filtered = filter === "All" ? submittals : submittals.filter((s) => s.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Submittals</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ New Submittal</button>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["All", ...SUBMITTAL_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s} ({s === "All" ? submittals.length : submittals.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            {["No.", "Title", "Spec Section", "Type", "Rev.", "Status", "Due Date", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No submittals yet.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">#{s.number}</td>
                <td className="px-4 py-3 text-sm"><button onClick={() => openDetail(s)} className="text-brand-orange hover:underline font-medium text-left">{s.title || "Untitled"}</button></td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.spec_section || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.type || "—"}</td>
                <td className="px-4 py-3 text-sm text-center font-mono">{s.revision ?? 0}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.due_date)}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(s)} className="text-xs text-brand-orange hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Submittal #${selected?.number} — ${selected?.title}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3 flex-wrap items-center">
              <StatusBadge status={selected.status} />
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selected.type}</span>
              <span className="text-xs text-gray-500">Rev. {selected.revision ?? 0}</span>
              {selected.spec_section && <span className="text-xs text-gray-500">Spec: {selected.spec_section}</span>}
              {selected.due_date && <span className="text-xs text-gray-500">Due: {formatDate(selected.due_date)}</span>}
            </div>
            {selected.review_comments && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Review Comments</p>
                <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3 whitespace-pre-wrap">{selected.review_comments}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Review Action</p>
              <div className="flex gap-2 flex-wrap">
                {["Approved", "Approved with Comments", "Revise & Resubmit", "Rejected"].map((action) => (
                  <button key={action} onClick={() => setStatus(selected, action)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${selected.status === action ? "bg-brand-navy text-white border-brand-navy" : "border-gray-200 text-gray-600 hover:border-brand-navy hover:text-brand-navy"}`}>
                    {action}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600">Edit</button>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit Submittal" : "New Submittal"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Number</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.number} onChange={(e) => set("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Spec Section</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 03 30 00" value={form.spec_section} onChange={(e) => set("spec_section", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>{SUBMITTAL_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>{SUBMITTAL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Revision</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.revision} onChange={(e) => set("revision", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Submitted By</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.submitted_by} onChange={(e) => set("submitted_by", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Reviewer</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.reviewer} onChange={(e) => set("reviewer", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Review Comments</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.review_comments} onChange={(e) => set("review_comments", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selected ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
