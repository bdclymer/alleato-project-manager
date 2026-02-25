"use client";

import { useState, useEffect, useCallback } from "react";
import { listDrawings, listDrawingSets, deleteDrawing, getDrawingStats, updateDrawing, createRevision, listRevisions } from "@/lib/drawings";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";
import { formatFileSize, getFileExtension } from "@/lib/drawing-storage";
import { cn } from "@/lib/utils";

const DISCIPLINES = [
  { value: "", label: "All Disciplines" },
  { value: "architectural", label: "Architectural" },
  { value: "structural", label: "Structural" },
  { value: "mechanical", label: "Mechanical" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "civil", label: "Civil" },
  { value: "landscape", label: "Landscape" },
  { value: "fire_protection", label: "Fire Protection" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "current", label: "Current" },
  { value: "superseded", label: "Superseded" },
  { value: "void", label: "Void" },
];

interface DrawingLogProps {
  projectId: string;
  onViewDrawing: (drawingId: string) => void;
}

export function DrawingLog({ projectId, onViewDrawing }: DrawingLogProps) {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSet, setFilterSet] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [revisionModal, setRevisionModal] = useState<any>(null);
  const [revisionData, setRevisionData] = useState<Record<string, any>>({});
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showRevisions, setShowRevisions] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, s, st] = await Promise.all([
        listDrawings(projectId, {
          discipline: filterDiscipline || undefined,
          status: filterStatus || undefined,
          setId: filterSet || undefined,
          search: search || undefined,
        }),
        listDrawingSets(projectId),
        getDrawingStats(projectId).catch(() => null),
      ]);
      setDrawings(d);
      setSets(s);
      setStats(st);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [projectId, filterDiscipline, filterStatus, filterSet, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDrawing(deleteId);
      setDeleteId(null);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    }
  };

  const openNewRevision = (drawing: any) => {
    setRevisionModal(drawing);
    setRevisionData({
      revision_number: "",
      description: "",
    });
  };

  const handleSaveRevision = async () => {
    if (!revisionModal) return;
    setSaving(true);
    try {
      await createRevision({
        drawing_id: revisionModal.id,
        project_id: projectId,
        revision_number: revisionData.revision_number,
        description: revisionData.description,
        file_url: revisionModal.file_url,
        file_name: revisionModal.file_name,
        file_size: revisionModal.file_size,
      });
      setRevisionModal(null);
      await load();
    } catch (e: any) {
      alert("Error: " + (e.message || "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  const loadRevisions = async (drawingId: string) => {
    if (showRevisions === drawingId) {
      setShowRevisions(null);
      return;
    }
    try {
      const revs = await listRevisions(drawingId);
      setRevisions(revs);
      setShowRevisions(drawingId);
    } catch { /* ignore */ }
  };

  const getSetName = (setId: string) => sets.find((s) => s.id === setId)?.name || "—";

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-brand-navy">{stats.totalDrawings}</p>
            <p className="text-xs text-gray-400">Total Drawings</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">{stats.byStatus?.current || 0}</p>
            <p className="text-xs text-gray-400">Current</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.byStatus?.superseded || 0}</p>
            <p className="text-xs text-gray-400">Superseded</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-brand-navy">{stats.totalSets}</p>
            <p className="text-xs text-gray-400">Drawing Sets</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search drawings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
        />
        <select
          value={filterDiscipline}
          onChange={(e) => setFilterDiscipline(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {DISCIPLINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={filterSet}
          onChange={(e) => setFilterSet(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">All Sets</option>
          {sets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <p className="text-xs text-gray-400 ml-auto">{drawings.length} drawings</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Discipline</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Set</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rev</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rev Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drawings.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No drawings found.</td></tr>
                ) : (
                  drawings.map((d) => (
                    <>
                      <tr
                        key={d.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          {d.file_url && (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-gray-400 uppercase">
                                {getFileExtension(d.file_name || d.file_url || "")}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-brand-navy cursor-pointer" onClick={() => onViewDrawing(d.id)}>
                          {d.drawing_number || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => onViewDrawing(d.id)}>
                          {d.title || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {d.discipline ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                              {d.discipline.replace(/_/g, " ")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {d.drawing_set_id ? getSetName(d.drawing_set_id) : d.set_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => loadRevisions(d.id)}
                            className="text-brand-orange hover:underline font-medium"
                          >
                            {d.revision || "—"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm">{formatDate(d.revision_date)}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onViewDrawing(d.id)}
                              className="p-1 text-gray-400 hover:text-brand-orange rounded"
                              title="Open Viewer"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                            <button
                              onClick={() => openNewRevision(d)}
                              className="p-1 text-gray-400 hover:text-brand-navy rounded"
                              title="New Revision"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6" /></svg>
                            </button>
                            <button
                              onClick={() => setDeleteId(d.id)}
                              className="p-1 text-gray-300 hover:text-red-500 rounded"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline revision history */}
                      {showRevisions === d.id && (
                        <tr key={`${d.id}-revs`}>
                          <td colSpan={9} className="px-8 py-3 bg-gray-50/80">
                            <div className="text-xs font-semibold text-gray-500 mb-2">Revision History</div>
                            {revisions.length === 0 ? (
                              <p className="text-xs text-gray-400">No revision history</p>
                            ) : (
                              <div className="space-y-1">
                                {revisions.map((r) => (
                                  <div key={r.id} className="flex items-center gap-4 text-xs">
                                    <span className={cn("font-medium", r.status === "current" ? "text-green-600" : "text-gray-400")}>
                                      {r.revision_number}
                                    </span>
                                    <span className="text-gray-400">{formatDate(r.revision_date)}</span>
                                    <span className="text-gray-500 flex-1">{r.description || "—"}</span>
                                    <StatusBadge status={r.status} />
                                    <span className="text-gray-400">{r.uploaded_by || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Revision Modal */}
      <Modal open={!!revisionModal} onClose={() => setRevisionModal(null)} title={`New Revision — ${revisionModal?.drawing_number || ""}`}>
        <form onSubmit={(e) => { e.preventDefault(); handleSaveRevision(); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Revision Number *</label>
              <input
                type="text"
                value={revisionData.revision_number || ""}
                onChange={(e) => setRevisionData({ ...revisionData, revision_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="e.g. Rev B, 2, etc."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea
                value={revisionData.description || ""}
                onChange={(e) => setRevisionData({ ...revisionData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                rows={3}
                placeholder="Describe what changed in this revision..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setRevisionModal(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50">
              {saving ? "Saving..." : "Create Revision"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Drawing">
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this drawing and all its revisions? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
