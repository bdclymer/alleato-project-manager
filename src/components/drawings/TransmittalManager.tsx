"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listTransmittals, createTransmittal, updateTransmittal, deleteTransmittal,
  sendTransmittal, listTransmittalItems, addTransmittalItem, acknowledgeTransmittalItem,
  listDrawings,
} from "@/lib/drawings";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentUser } from "@/lib/user-context";
import { formatDate } from "@/lib/utils";

interface TransmittalManagerProps {
  projectId: string;
}

const PURPOSE_OPTS = [
  { value: "for_review", label: "For Review" },
  { value: "for_construction", label: "For Construction" },
  { value: "for_approval", label: "For Approval" },
  { value: "for_information", label: "For Information" },
  { value: "as_requested", label: "As Requested" },
];

export function TransmittalManager({ projectId }: TransmittalManagerProps) {
  const [transmittals, setTransmittals] = useState<any[]>([]);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTransmittal, setEditTransmittal] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedDrawings, setSelectedDrawings] = useState<string[]>([]);
  const [showAddDrawings, setShowAddDrawings] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, d] = await Promise.all([
        listTransmittals(projectId),
        listDrawings(projectId),
      ]);
      setTransmittals(t);
      setDrawings(d);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const loadItems = useCallback(async (transmittalId: string) => {
    try {
      const i = await listTransmittalItems(transmittalId);
      setItems(i);
    } catch { /* ignore */ }
  }, []);

  const openCreate = () => {
    setEditTransmittal(null);
    setFormData({
      project_id: projectId,
      status: "draft",
      purpose: "for_review",
      signature_required: false,
    });
    setModalOpen(true);
  };

  const openEdit = (t: any) => {
    setEditTransmittal(t);
    setFormData({
      subject: t.subject || "",
      to_company: t.to_company || "",
      to_contact: t.to_contact || "",
      to_email: t.to_email || "",
      from_company: t.from_company || "",
      from_contact: t.from_contact || "",
      from_email: t.from_email || "",
      due_date: t.due_date || "",
      purpose: t.purpose || "for_review",
      cover_notes: t.cover_notes || "",
      signature_required: t.signature_required || false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editTransmittal) {
        await updateTransmittal(editTransmittal.id, formData);
      } else {
        await createTransmittal(formData);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransmittal(deleteId);
      setDeleteId(null);
      if (detailId === deleteId) setDetailId(null);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Send this transmittal? This will mark it as sent.")) return;
    try {
      await sendTransmittal(id);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const handleAddDrawings = async () => {
    if (!detailId || selectedDrawings.length === 0) return;
    try {
      for (const dId of selectedDrawings) {
        const d = drawings.find((dr) => dr.id === dId);
        await addTransmittalItem({
          transmittal_id: detailId,
          drawing_id: dId,
          drawing_number: d?.drawing_number || "",
          title: d?.title || "",
          revision: d?.revision || "",
          copies: 1,
          format: "pdf",
        });
      }
      setSelectedDrawings([]);
      setShowAddDrawings(false);
      await loadItems(detailId);
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const handleAcknowledge = async (itemId: string) => {
    try {
      await acknowledgeTransmittalItem(itemId, getCurrentUser());
      if (detailId) await loadItems(detailId);
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const openDetail = (t: any) => {
    setDetailId(t.id);
    loadItems(t.id);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Detail view
  if (detailId) {
    const t = transmittals.find((tr) => tr.id === detailId);
    if (!t) return null;
    return (
      <div>
        <button onClick={() => setDetailId(null)} className="flex items-center gap-1 text-sm text-brand-orange hover:underline mb-4">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Transmittals
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-navy">{t.transmittal_number}</h3>
              <p className="text-sm text-gray-500">{t.subject || "No subject"}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              {t.status === "draft" && (
                <button onClick={() => handleSend(t.id)} className="px-3 py-1.5 bg-brand-orange text-white text-xs font-medium rounded-lg hover:bg-brand-orange-dark">
                  Send
                </button>
              )}
              <button onClick={() => openEdit(t)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200">
                Edit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div><span className="text-gray-400 block">To</span><span className="text-gray-700 font-medium">{t.to_company || "—"}<br />{t.to_contact || ""}</span></div>
            <div><span className="text-gray-400 block">From</span><span className="text-gray-700 font-medium">{t.from_company || "—"}<br />{t.from_contact || ""}</span></div>
            <div><span className="text-gray-400 block">Sent</span><span className="text-gray-700 font-medium">{formatDate(t.sent_date) || "Not sent"}</span></div>
            <div><span className="text-gray-400 block">Purpose</span><span className="text-gray-700 font-medium">{PURPOSE_OPTS.find((p) => p.value === t.purpose)?.label || t.purpose}</span></div>
          </div>

          {t.cover_notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <span className="text-gray-400 block mb-1">Cover Notes</span>
              {t.cover_notes}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-navy">Drawings ({items.length})</span>
            <button onClick={() => setShowAddDrawings(true)} className="px-3 py-1.5 bg-brand-orange text-white text-xs font-medium rounded-lg hover:bg-brand-orange-dark">
              + Add Drawings
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Rev</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Copies</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Acknowledged</th>
                <th className="px-4 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No drawings added yet.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-sm">{item.drawing_number || "—"}</td>
                    <td className="px-4 py-2 text-sm">{item.title || "—"}</td>
                    <td className="px-4 py-2 text-sm">{item.revision || "—"}</td>
                    <td className="px-4 py-2 text-sm">{item.copies}</td>
                    <td className="px-4 py-2 text-sm">
                      {item.acknowledged ? (
                        <span className="text-green-600 text-xs">
                          Yes — {item.acknowledged_by} ({formatDate(item.acknowledged_date)})
                        </span>
                      ) : (
                        <button onClick={() => handleAcknowledge(item.id)} className="text-xs text-brand-orange hover:underline">
                          Acknowledge
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-400">{item.format}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Drawings Modal */}
        <Modal open={showAddDrawings} onClose={() => { setShowAddDrawings(false); setSelectedDrawings([]); }} title="Add Drawings to Transmittal" wide>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {drawings.map((d) => (
              <label key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDrawings.includes(d.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedDrawings((prev) => [...prev, d.id]);
                    else setSelectedDrawings((prev) => prev.filter((id) => id !== d.id));
                  }}
                  className="w-4 h-4 text-brand-orange rounded"
                />
                <span className="text-sm text-gray-700 font-medium">{d.drawing_number}</span>
                <span className="text-sm text-gray-500 flex-1">{d.title}</span>
                <span className="text-xs text-gray-400">Rev {d.revision || "—"}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
            <button onClick={() => { setShowAddDrawings(false); setSelectedDrawings([]); }} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button
              onClick={handleAddDrawings}
              disabled={selectedDrawings.length === 0}
              className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50"
            >
              Add {selectedDrawings.length} Drawing{selectedDrawings.length !== 1 ? "s" : ""}
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{transmittals.length} transmittal{transmittals.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New Transmittal
        </button>
      </div>

      {transmittals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No transmittals yet. Create one to send drawings to subs or owners.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Purpose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transmittals.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => openDetail(t)}>
                  <td className="px-4 py-3 text-sm font-medium text-brand-navy">{t.transmittal_number}</td>
                  <td className="px-4 py-3 text-sm">{t.subject || "—"}</td>
                  <td className="px-4 py-3 text-sm">{t.to_company || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {PURPOSE_OPTS.find((p) => p.value === t.purpose)?.label || t.purpose}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(t.sent_date)}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTransmittal ? "Edit Transmittal" : "New Transmittal"} wide>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <input type="text" value={formData.subject || ""} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Company</label>
              <input type="text" value={formData.to_company || ""} onChange={(e) => setFormData({ ...formData, to_company: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Contact</label>
              <input type="text" value={formData.to_contact || ""} onChange={(e) => setFormData({ ...formData, to_contact: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">To Email</label>
              <input type="email" value={formData.to_email || ""} onChange={(e) => setFormData({ ...formData, to_email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
              <select value={formData.purpose || "for_review"} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {PURPOSE_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Company</label>
              <input type="text" value={formData.from_company || ""} onChange={(e) => setFormData({ ...formData, from_company: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">From Contact</label>
              <input type="text" value={formData.from_contact || ""} onChange={(e) => setFormData({ ...formData, from_contact: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
              <input type="date" value={formData.due_date?.substring(0, 10) || ""} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.signature_required || false} onChange={(e) => setFormData({ ...formData, signature_required: e.target.checked })} className="w-4 h-4 text-brand-orange rounded" />
              <label className="text-sm text-gray-600">Require acknowledgment signature</label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Cover Notes</label>
              <textarea value={formData.cover_notes || ""} onChange={(e) => setFormData({ ...formData, cover_notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={4} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50">
              {saving ? "Saving..." : editTransmittal ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Transmittal">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this transmittal?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
