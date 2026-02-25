"use client";

import { useState, useEffect, useCallback } from "react";
import { listDrawingSets, createDrawingSet, updateDrawingSet, deleteDrawingSet, listDrawings } from "@/lib/drawings";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

const DISCIPLINES = [
  { value: "architectural", label: "Architectural", color: "bg-blue-100 text-blue-700" },
  { value: "structural", label: "Structural", color: "bg-purple-100 text-purple-700" },
  { value: "mechanical", label: "Mechanical", color: "bg-green-100 text-green-700" },
  { value: "electrical", label: "Electrical", color: "bg-yellow-100 text-yellow-700" },
  { value: "plumbing", label: "Plumbing", color: "bg-cyan-100 text-cyan-700" },
  { value: "civil", label: "Civil", color: "bg-orange-100 text-orange-700" },
  { value: "landscape", label: "Landscape", color: "bg-emerald-100 text-emerald-700" },
  { value: "fire_protection", label: "Fire Protection", color: "bg-red-100 text-red-700" },
];

interface DrawingSetsProps {
  projectId: string;
  onSelectSet?: (setId: string) => void;
}

export function DrawingSets({ projectId, onSelectSet }: DrawingSetsProps) {
  const [sets, setSets] = useState<any[]>([]);
  const [drawingCounts, setDrawingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSet, setEditSet] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [setsData, drawings] = await Promise.all([
        listDrawingSets(projectId),
        listDrawings(projectId),
      ]);
      setSets(setsData);
      const counts: Record<string, number> = {};
      drawings.forEach((d: any) => {
        if (d.drawing_set_id) {
          counts[d.drawing_set_id] = (counts[d.drawing_set_id] || 0) + 1;
        }
      });
      setDrawingCounts(counts);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditSet(null);
    setFormData({ project_id: projectId, discipline: "architectural", status: "active" });
    setModalOpen(true);
  };

  const openEdit = (set: any) => {
    setEditSet(set);
    setFormData({
      name: set.name || "",
      set_number: set.set_number || "",
      discipline: set.discipline || "",
      description: set.description || "",
      received_date: set.received_date || "",
      issued_by: set.issued_by || "",
      status: set.status || "active",
      auto_number_prefix: set.auto_number_prefix || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editSet) {
        await updateDrawingSet(editSet.id, formData);
      } else {
        await createDrawingSet(formData);
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
      await deleteDrawingSet(deleteId);
      setDeleteId(null);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const getDisciplineInfo = (val: string) =>
    DISCIPLINES.find((d) => d.value === val) || { label: val, color: "bg-gray-100 text-gray-700" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{sets.length} set{sets.length !== 1 ? "s" : ""}</p>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New Set
        </button>
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No drawing sets yet. Create one to organize your drawings.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((set) => {
            const disc = getDisciplineInfo(set.discipline);
            return (
              <div
                key={set.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectSet?.(set.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-brand-navy">{set.name}</h3>
                    {set.set_number && <p className="text-xs text-gray-400">#{set.set_number}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${disc.color}`}>
                      {disc.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(set); }}
                      className="text-gray-300 hover:text-brand-navy"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                    </button>
                  </div>
                </div>
                {set.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{set.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{drawingCounts[set.id] || 0} drawings</span>
                  {set.received_date && <span>Received {formatDate(set.received_date)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editSet ? "Edit Drawing Set" : "New Drawing Set"} wide>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Set Name *</label>
              <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Set Number</label>
              <input type="text" value={formData.set_number || ""} onChange={(e) => setFormData({ ...formData, set_number: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
              <select value={formData.discipline || ""} onChange={(e) => setFormData({ ...formData, discipline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                {DISCIPLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Received Date</label>
              <input type="date" value={formData.received_date?.substring(0, 10) || ""} onChange={(e) => setFormData({ ...formData, received_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Issued By</label>
              <input type="text" value={formData.issued_by || ""} onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={formData.status || "active"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="superseded">Superseded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Auto-Number Prefix</label>
              <input type="text" value={formData.auto_number_prefix || ""} onChange={(e) => setFormData({ ...formData, auto_number_prefix: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g. A-" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={3} />
            </div>
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <div>
              {editSet && (
                <button type="button" onClick={() => { setModalOpen(false); setDeleteId(editSet.id); }} className="px-4 py-2 text-sm text-red-500 hover:text-red-700">
                  Delete Set
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50">
                {saving ? "Saving..." : editSet ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Drawing Set">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this drawing set? Drawings within this set will be preserved but unassigned.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
