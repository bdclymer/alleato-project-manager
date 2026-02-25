"use client";

import { useEffect, useState } from "react";
import { getBudgets, getProjects } from "@/lib/queries";
import { createBudget, updateBudget, deleteBudget } from "@/lib/mutations";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/Modal";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const emptyForm = { project_id: "", code: "", description: "", original_amount: "", revised_amount: "", committed_amount: "", actual_amount: "", category: "" };

export default function BudgetsPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = () => Promise.all([getBudgets(), getProjects()]).then(([d, p]) => { setData(d); setProjects(p); setLoading(false); });
  useEffect(() => { reload(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      project_id: row.project_id || "", code: row.code || "", description: row.description || "",
      original_amount: row.original_amount?.toString() || "", revised_amount: row.revised_amount?.toString() || "",
      committed_amount: row.committed_amount?.toString() || "", actual_amount: row.actual_amount?.toString() || "",
      category: row.category || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const numForm = {
      ...form,
      original_amount: form.original_amount ? parseFloat(form.original_amount) : null,
      revised_amount: form.revised_amount ? parseFloat(form.revised_amount) : null,
      committed_amount: form.committed_amount ? parseFloat(form.committed_amount) : null,
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : null,
    };
    try {
      if (editing) await updateBudget(editing.id, numForm);
      else await createBudget(numForm);
      setModalOpen(false);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget line item?")) return;
    setDeleting(id);
    try { await deleteBudget(id); await reload(); } catch (e: any) { alert("Error: " + e.message); }
    setDeleting(null);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  const totalOriginal = data.reduce((s, r) => s + (r.original_amount || 0), 0);
  const totalRevised = data.reduce((s, r) => s + (r.revised_amount || 0), 0);
  const totalCommitted = data.reduce((s, r) => s + (r.committed_amount || 0), 0);
  const totalVariance = data.reduce((s, r) => s + (r.variance || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Budgets" count={data.length} />
        <button onClick={openCreate} className={btnPrimary}>+ New Budget Line</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Original Budget" value={formatCurrency(totalOriginal)} />
        <StatCard label="Revised Budget" value={formatCurrency(totalRevised)} />
        <StatCard label="Committed" value={formatCurrency(totalCommitted)} />
        <StatCard label="Variance" value={formatCurrency(totalVariance)} />
      </div>

      <DataTable data={data} columns={[
        { key: "project", header: "Project", render: (r) => <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">{(r as any).projects?.name || r.project_id}</Link> },
        { key: "code", header: "Code" },
        { key: "description", header: "Description" },
        { key: "original_amount", header: "Original", render: (r) => formatCurrency(r.original_amount), className: "text-right" },
        { key: "revised_amount", header: "Revised", render: (r) => formatCurrency(r.revised_amount), className: "text-right" },
        { key: "committed_amount", header: "Committed", render: (r) => formatCurrency(r.committed_amount), className: "text-right" },
        { key: "variance", header: "Variance", render: (r) => <span className={r.variance < 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(r.variance)}</span>, className: "text-right" },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(r)} className="text-xs text-brand-orange hover:underline">Edit</button>
            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-xs text-red-500 hover:underline">{deleting === r.id ? "..." : "Delete"}</button>
          </div>
        )},
      ]} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Budget Line" : "New Budget Line"}>
        <FormField label="Project">
          <select className={selectClass} value={form.project_id} onChange={(e) => set("project_id", e.target.value)}>
            <option value="">Select project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Code"><input className={inputClass} value={form.code} onChange={(e) => set("code", e.target.value)} /></FormField>
          <FormField label="Category"><input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} /></FormField>
        </div>
        <FormField label="Description"><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Original Amount"><input type="number" step="0.01" className={inputClass} value={form.original_amount} onChange={(e) => set("original_amount", e.target.value)} /></FormField>
          <FormField label="Revised Amount"><input type="number" step="0.01" className={inputClass} value={form.revised_amount} onChange={(e) => set("revised_amount", e.target.value)} /></FormField>
          <FormField label="Committed Amount"><input type="number" step="0.01" className={inputClass} value={form.committed_amount} onChange={(e) => set("committed_amount", e.target.value)} /></FormField>
          <FormField label="Actual Amount"><input type="number" step="0.01" className={inputClass} value={form.actual_amount} onChange={(e) => set("actual_amount", e.target.value)} /></FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Budget Line"}</button>
        </div>
      </Modal>
    </div>
  );
}
