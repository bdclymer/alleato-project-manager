"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/Modal";

const CO_STATUSES = ["Draft", "Pending", "Submitted", "Approved", "Rejected", "Void"];
const CO_TYPES = ["Owner Change", "Unforeseen Condition", "Design Error", "Design Omission", "Owner Request", "Other"];

const emptyForm = {
  number: "", title: "", description: "", type: "Owner Request", status: "Draft",
  cost_impact: "0", schedule_impact_days: "0", submitted_by: "", date_submitted: "",
  date_approved: "", notes: "",
};

export default function ChangeEventsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    const { data } = await supabase.from("change_events").select("*").eq("project_id", projectId).order("number", { ascending: true });
    setChangeOrders(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const openCreate = async () => {
    const { count } = await supabase.from("change_events").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    setForm({ ...emptyForm, number: String((count || 0) + 1) } as any);
    setSelected(null);
    setModalOpen(true);
  };

  const openDetail = (co: any) => { setSelected(co); setDetailOpen(true); };
  const openEdit = (co: any) => {
    setSelected(co);
    setForm({
      number: co.number || "", title: co.title || "", description: co.description || "",
      type: co.type || "Owner Request", status: co.status || "Draft",
      cost_impact: co.cost_impact !== undefined ? String(co.cost_impact) : "0",
      schedule_impact_days: co.schedule_impact_days !== undefined ? String(co.schedule_impact_days) : "0",
      submitted_by: co.submitted_by || "", date_submitted: co.date_submitted?.substring(0, 10) || "",
      date_approved: co.date_approved?.substring(0, 10) || "", notes: co.notes || "",
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form, project_id: projectId,
        cost_impact: parseFloat(form.cost_impact) || 0,
        schedule_impact_days: parseInt(form.schedule_impact_days) || 0,
      };
      if (selected) await supabase.from("change_events").update(payload).eq("id", selected.id);
      else await supabase.from("change_events").insert(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const setStatus = async (co: any, status: string) => {
    const updateData: any = { status };
    if (status === "Approved") updateData.date_approved = new Date().toISOString().substring(0, 10);
    await supabase.from("change_events").update(updateData).eq("id", co.id);
    await load();
    if (selected?.id === co.id) setSelected({ ...co, ...updateData });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const filtered = filter === "All" ? changeOrders : changeOrders.filter((c) => c.status === filter);
  const totalApproved = changeOrders.filter((c) => c.status === "Approved").reduce((sum, c) => sum + (c.cost_impact || 0), 0);

  const fmtCurrency = (v: number) => v >= 0
    ? `+$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : `-$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Change Events</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ New Change Event</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Change Events</p>
          <p className="text-2xl font-bold text-brand-navy">{changeOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{changeOrders.filter((c) => ["Pending", "Submitted"].includes(c.status)).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Approved Cost Impact</p>
          <p className={`text-2xl font-bold ${totalApproved >= 0 ? "text-red-600" : "text-green-600"}`}>{fmtCurrency(totalApproved)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["All", ...CO_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {s} ({s === "All" ? changeOrders.length : changeOrders.filter((c) => c.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            {["No.", "Title", "Type", "Status", "Cost Impact", "Schedule (Days)", "Submitted", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No change events yet.</td></tr>
            ) : filtered.map((co) => (
              <tr key={co.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">#{co.number}</td>
                <td className="px-4 py-3 text-sm"><button onClick={() => openDetail(co)} className="text-brand-orange hover:underline font-medium text-left">{co.title || "Untitled"}</button></td>
                <td className="px-4 py-3 text-sm text-gray-500">{co.type || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={co.status} /></td>
                <td className={`px-4 py-3 text-sm font-semibold ${(co.cost_impact || 0) > 0 ? "text-red-600" : (co.cost_impact || 0) < 0 ? "text-green-600" : "text-gray-400"}`}>
                  {co.cost_impact != null ? fmtCurrency(co.cost_impact) : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{co.schedule_impact_days != null ? `${co.schedule_impact_days > 0 ? "+" : ""}${co.schedule_impact_days}` : "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(co.date_submitted)}</td>
                <td className="px-4 py-3">
                  {co.status === "Pending" || co.status === "Submitted" ? (
                    <div className="flex gap-2">
                      <button onClick={() => setStatus(co, "Approved")} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">Approve</button>
                      <button onClick={() => setStatus(co, "Rejected")} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium">Reject</button>
                    </div>
                  ) : (
                    <button onClick={() => openEdit(co)} className="text-xs text-brand-orange hover:underline">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Change Event #${selected?.number} — ${selected?.title}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="flex gap-3 flex-wrap items-center">
              <StatusBadge status={selected.status} />
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{selected.type}</span>
              <span className={`text-sm font-bold ${(selected.cost_impact || 0) > 0 ? "text-red-600" : "text-green-600"}`}>{fmtCurrency(selected.cost_impact || 0)}</span>
              {selected.schedule_impact_days != null && <span className="text-xs text-gray-500">{selected.schedule_impact_days > 0 ? "+" : ""}{selected.schedule_impact_days} days</span>}
            </div>
            {selected.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.description}</p>
              </div>
            )}
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}
            {(selected.status === "Pending" || selected.status === "Submitted" || selected.status === "Draft") && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions</p>
                <div className="flex gap-2 flex-wrap">
                  {selected.status === "Draft" && <button onClick={() => setStatus(selected, "Submitted")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-navy text-white">Submit for Approval</button>}
                  <button onClick={() => setStatus(selected, "Approved")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white">Approve</button>
                  <button onClick={() => setStatus(selected, "Rejected")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white">Reject</button>
                  <button onClick={() => setStatus(selected, "Void")} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600">Void</button>
                </div>
              </div>
            )}
            <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600">Edit</button>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit Change Event" : "New Change Event"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Number</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.number} onChange={(e) => set("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => set("type", e.target.value)}>{CO_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>{CO_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Cost Impact ($)</label><input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Use negative for deduct" value={form.cost_impact} onChange={(e) => set("cost_impact", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Schedule Impact (days)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.schedule_impact_days} onChange={(e) => set("schedule_impact_days", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Date Submitted</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.date_submitted} onChange={(e) => set("date_submitted", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selected ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
