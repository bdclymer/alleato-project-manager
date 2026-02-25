"use client";

import { useEffect, useState } from "react";
import { getCommitmentCOs, getContractCOs, getProjects } from "@/lib/queries";
import { createCommitmentCO, updateCommitmentCO, deleteCommitmentCO, createContractCO, updateContractCO, deleteContractCO } from "@/lib/mutations";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal, FormField, inputClass, selectClass, btnPrimary, btnSecondary } from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const emptyCommitment = { project_id: "", number: "", title: "", description: "", status: "Draft", amount: "", vendor: "", reason: "" };
const emptyContract = { project_id: "", number: "", title: "", description: "", status: "Draft", amount: "", reason: "" };

export default function ChangeOrdersPage() {
  const [ccos, setCcos] = useState<any[]>([]);
  const [ctcos, setCtcos] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tab, setTab] = useState<"commitment" | "contract">("commitment");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyCommitment);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = () => Promise.all([getCommitmentCOs(), getContractCOs(), getProjects()]).then(([c, ct, p]) => {
    setCcos(c); setCtcos(ct); setProjects(p); setLoading(false);
  });
  useEffect(() => { reload(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(tab === "commitment" ? emptyCommitment : emptyContract);
    setModalOpen(true);
  };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({
      project_id: row.project_id || "", number: row.number || "", title: row.title || "",
      description: row.description || "", status: row.status || "Draft",
      amount: row.amount?.toString() || "", vendor: row.vendor || "", reason: row.reason || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const numForm = { ...form, amount: form.amount ? parseFloat(form.amount) : null };
    try {
      if (tab === "commitment") {
        if (editing) await updateCommitmentCO(editing.id, numForm);
        else await createCommitmentCO(numForm);
      } else {
        if (editing) await updateContractCO(editing.id, numForm);
        else await createContractCO(numForm);
      }
      setModalOpen(false);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this change order?")) return;
    setDeleting(id);
    try {
      if (tab === "commitment") await deleteCommitmentCO(id);
      else await deleteContractCO(id);
      await reload();
    } catch (e: any) { alert("Error: " + e.message); }
    setDeleting(null);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  const ccoTotal = ccos.reduce((s, r) => s + (r.amount || 0), 0);
  const ctcoTotal = ctcos.reduce((s, r) => s + (r.amount || 0), 0);
  const data = tab === "commitment" ? ccos : ctcos;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Change Orders" count={ccos.length + ctcos.length} />
        <button onClick={openCreate} className={btnPrimary}>+ New {tab === "commitment" ? "Commitment" : "Contract"} CO</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Commitment COs" value={ccos.length} sub={formatCurrency(ccoTotal)} />
        <StatCard label="Contract COs" value={ctcos.length} sub={formatCurrency(ctcoTotal)} />
        <StatCard label="Total COs" value={ccos.length + ctcos.length} />
        <StatCard label="Total Amount" value={formatCurrency(ccoTotal + ctcoTotal)} />
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("commitment")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "commitment" ? "bg-brand-orange text-white" : "bg-white text-gray-500 hover:bg-gray-100"}`}>
          Commitment COs ({ccos.length})
        </button>
        <button onClick={() => setTab("contract")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "contract" ? "bg-brand-orange text-white" : "bg-white text-gray-500 hover:bg-gray-100"}`}>
          Contract COs ({ctcos.length})
        </button>
      </div>

      <DataTable data={data} searchField="title" columns={[
        { key: "number", header: "#" },
        { key: "title", header: "Title" },
        { key: "project", header: "Project", render: (r) => <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">{(r as any).projects?.name || r.project_id}</Link> },
        ...(tab === "commitment" ? [{ key: "vendor", header: "Vendor" } as any] : []),
        { key: "amount", header: "Amount", render: (r: any) => formatCurrency(r.amount), className: "text-right" },
        { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
        { key: "reason", header: "Reason" },
        { key: "approved_date", header: "Approved", render: (r: any) => formatDate(r.approved_date) },
        { key: "actions", header: "", render: (r: any) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(r)} className="text-xs text-brand-orange hover:underline">Edit</button>
            <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="text-xs text-red-500 hover:underline">{deleting === r.id ? "..." : "Delete"}</button>
          </div>
        )},
      ]} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${tab === "commitment" ? "Commitment" : "Contract"} CO` : `New ${tab === "commitment" ? "Commitment" : "Contract"} CO`}>
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
              <option>Draft</option><option>Pending</option><option>Approved</option><option>Rejected</option>
            </select>
          </FormField>
        </div>
        <FormField label="Title"><input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></FormField>
        <FormField label="Description"><textarea className={inputClass} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount"><input type="number" step="0.01" className={inputClass} value={form.amount} onChange={(e) => set("amount", e.target.value)} /></FormField>
          {tab === "commitment" && <FormField label="Vendor"><input className={inputClass} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} /></FormField>}
        </div>
        <FormField label="Reason"><textarea className={inputClass} rows={2} value={form.reason} onChange={(e) => set("reason", e.target.value)} /></FormField>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>{saving ? "Saving..." : editing ? "Save Changes" : "Create CO"}</button>
        </div>
      </Modal>
    </div>
  );
}
