"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/Modal";

const RFI_STATUSES = ["Draft", "Open", "Under Review", "Answered", "Closed"];
const BALL_IN_COURT = ["Contractor", "Owner", "Architect", "Engineer", "Subcontractor"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];

const emptyForm = {
  number: "", subject: "", question: "", status: "Open", priority: "Normal",
  ball_in_court: "Architect", due_date: "", assignee: "", spec_section: "",
  answer: "",
};

export default function RFIsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [rfis, setRfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    const { data } = await supabase
      .from("rfis")
      .select("*")
      .eq("project_id", projectId)
      .order("number", { ascending: true });
    setRfis(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [projectId]);

  const openCreate = async () => {
    const { count } = await supabase.from("rfis").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    setForm({ ...emptyForm, number: String((count || 0) + 1) });
    setSelected(null);
    setModalOpen(true);
  };

  const openDetail = (rfi: any) => { setSelected(rfi); setDetailOpen(true); };
  const openEdit = (rfi: any) => {
    setSelected(rfi);
    setForm({
      number: rfi.number || "", subject: rfi.subject || "", question: rfi.question || "",
      status: rfi.status || "Open", priority: rfi.priority || "Normal",
      ball_in_court: rfi.ball_in_court || "Architect", due_date: rfi.due_date?.substring(0, 10) || "",
      assignee: rfi.assignee || "", spec_section: rfi.spec_section || "", answer: rfi.answer || "",
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected && !modalOpen) return;
      const payload = { ...form, project_id: projectId };
      if (selected) {
        await supabase.from("rfis").update(payload).eq("id", selected.id);
      } else {
        await supabase.from("rfis").insert(payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const advanceStatus = async (rfi: any) => {
    const idx = RFI_STATUSES.indexOf(rfi.status);
    if (idx >= RFI_STATUSES.length - 1) return;
    const next = RFI_STATUSES[idx + 1];
    await supabase.from("rfis").update({ status: next }).eq("id", rfi.id);
    await load();
    if (selected?.id === rfi.id) setSelected({ ...rfi, status: next });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = filter === "All" ? rfis : rfis.filter((r) => r.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">RFIs</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
          + New RFI
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["All", ...RFI_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s} {s === "All" ? `(${rfis.length})` : `(${rfis.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ball in Court</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Advance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">No RFIs found. Create the first one.</td></tr>
            ) : filtered.map((rfi) => (
              <tr key={rfi.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">#{rfi.number}</td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => openDetail(rfi)} className="text-brand-orange hover:underline font-medium text-left">{rfi.subject || "Untitled"}</button>
                </td>
                <td className="px-4 py-3"><StatusBadge status={rfi.status} /></td>
                <td className="px-4 py-3 text-sm text-gray-600">{rfi.ball_in_court || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${rfi.priority === "Urgent" ? "bg-red-100 text-red-700" : rfi.priority === "High" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                    {rfi.priority || "Normal"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(rfi.due_date)}</td>
                <td className="px-4 py-3">
                  {rfi.status !== "Closed" && (
                    <button onClick={() => advanceStatus(rfi)}
                      className="text-xs px-2.5 py-1 bg-brand-navy/10 text-brand-navy rounded hover:bg-brand-navy/20 transition-colors font-medium">
                      → {RFI_STATUSES[RFI_STATUSES.indexOf(rfi.status) + 1]}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`RFI #${selected?.number} — ${selected?.subject}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3 flex-wrap">
              <StatusBadge status={selected.status} />
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${selected.priority === "Urgent" ? "bg-red-100 text-red-700" : selected.priority === "High" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>{selected.priority}</span>
              <span className="text-xs text-gray-500 self-center">Ball in court: <strong>{selected.ball_in_court}</strong></span>
              {selected.due_date && <span className="text-xs text-gray-500 self-center">Due: {formatDate(selected.due_date)}</span>}
              {selected.spec_section && <span className="text-xs text-gray-500 self-center">Spec: {selected.spec_section}</span>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.question || "No question entered."}</p>
            </div>
            {selected.answer && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Answer</p>
                <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg p-3 whitespace-pre-wrap">{selected.answer}</p>
              </div>
            )}
            {selected.status !== "Closed" && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => advanceStatus(selected)} className="px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90">
                  Advance → {RFI_STATUSES[RFI_STATUSES.indexOf(selected.status) + 1]}
                </button>
                <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? `Edit RFI #${form.number}` : "New RFI"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">RFI Number</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.number} onChange={(e) => set("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Spec Section</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 03 30 00" value={form.spec_section} onChange={(e) => set("spec_section", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.subject} onChange={(e) => set("subject", e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Question</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={4} value={form.question} onChange={(e) => set("question", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                {RFI_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Ball in Court</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.ball_in_court} onChange={(e) => set("ball_in_court", e.target.value)}>
                {BALL_IN_COURT.map((b) => <option key={b}>{b}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Answer</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Enter response/answer here..." value={form.answer} onChange={(e) => set("answer", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : selected ? "Update RFI" : "Create RFI"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
