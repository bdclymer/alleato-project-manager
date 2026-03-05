"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Modal } from "@/components/Modal";

const COST_TYPES = ["General Conditions", "Site Work", "Concrete", "Masonry", "Metals", "Wood & Plastics", "Thermal & Moisture", "Openings", "Finishes", "Specialties", "Equipment", "Furnishings", "Special Construction", "Conveying Systems", "Mechanical", "Electrical", "Other"];

const emptyForm = { code: "", description: "", cost_type: "General Conditions", original_amount: "" };

const fmt = (v: number) => v == null ? "—" : "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtColor = (v: number) => v > 0 ? "text-red-600" : v < 0 ? "text-green-600" : "text-gray-400";

export default function BudgetPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [lines, setLines] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [contractCOs, setContractCOs] = useState<any[]>([]);
  const [changeEvents, setChangeEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [b, c, ccos, ce] = await Promise.all([
      supabase.from("budgets").select("*").eq("project_id", projectId).order("code"),
      supabase.from("commitments").select("*").eq("project_id", projectId),
      supabase.from("contract_change_orders").select("*").eq("project_id", projectId),
      supabase.from("change_events").select("*").eq("project_id", projectId),
    ]);
    setLines(b.data || []);
    setCommitments(c.data || []);
    setContractCOs(ccos.data || []);
    setChangeEvents(ce.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  // Compute financial values per budget line by cost code
  const enriched = lines.map((line) => {
    const originalBudget = Number(line.original_amount) || 0;

    // Approved contract COs for this cost code
    const approvedCOs = contractCOs
      .filter((co) => co.status === "approved" && (co.cost_code === line.code || !co.cost_code))
      .reduce((s, co) => s + (Number(co.amount) || 0), 0);

    // Open/pending change events (pending cost)
    const pendingChanges = changeEvents
      .filter((ce) => ["Draft", "Pending", "Submitted"].includes(ce.status) && ce.cost_code === line.code)
      .reduce((s, ce) => s + (Number(ce.cost_impact) || 0), 0);

    const revisedBudget = originalBudget + approvedCOs;

    // Total committed from subcontracts/POs for this cost code
    const committed = commitments
      .filter((c) => c.cost_code === line.code)
      .reduce((s, c) => s + (Number(c.contract_amount) || 0), 0);

    const actual = Number(line.actual_amount) || 0;
    const projected = committed > 0 ? committed : revisedBudget;
    const variance = revisedBudget - projected;

    return { ...line, originalBudget, approvedCOs, pendingChanges, revisedBudget, committed, actual, projected, variance };
  });

  // Totals
  const totals = enriched.reduce((acc, l) => ({
    original: acc.original + l.originalBudget,
    approvedCOs: acc.approvedCOs + l.approvedCOs,
    revised: acc.revised + l.revisedBudget,
    committed: acc.committed + l.committed,
    actual: acc.actual + l.actual,
    projected: acc.projected + l.projected,
    variance: acc.variance + l.variance,
  }), { original: 0, approvedCOs: 0, revised: 0, committed: 0, actual: 0, projected: 0, variance: 0 });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setSelected(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (line: any) => {
    setSelected(line);
    setForm({ code: line.code || "", description: line.description || "", cost_type: line.cost_type || "General Conditions", original_amount: line.original_amount != null ? String(line.original_amount) : "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, project_id: projectId, original_amount: parseFloat(form.original_amount) || 0 };
      if (selected) await supabase.from("budgets").update(payload).eq("id", selected.id);
      else await supabase.from("budgets").insert(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this budget line?")) return;
    await supabase.from("budgets").delete().eq("id", id);
    await load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Budget</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ Add Budget Line</button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Original Budget", value: totals.original, color: "text-brand-navy" },
          { label: "Approved COs", value: totals.approvedCOs, color: totals.approvedCOs >= 0 ? "text-red-600" : "text-green-600" },
          { label: "Revised Budget", value: totals.revised, color: "text-brand-navy font-bold" },
          { label: "Total Committed", value: totals.committed, color: "text-blue-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`text-xl font-bold ${c.color}`}>{fmt(c.value)}</div>
            <div className="text-xs text-gray-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Budget Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Cost Code", "Description", "Type", "Original Budget", "Approved COs", "Revised Budget", "Committed", "Projected Final", "Variance", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {enriched.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">No budget lines yet. Add cost codes to start tracking.</td></tr>
            ) : enriched.map((line) => (
              <tr key={line.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{line.code}</td>
                <td className="px-3 py-2.5 text-gray-800 font-medium">{line.description}</td>
                <td className="px-3 py-2.5 text-gray-500 text-xs">{line.cost_type || "—"}</td>
                <td className="px-3 py-2.5 text-gray-600">{fmt(line.originalBudget)}</td>
                <td className={`px-3 py-2.5 font-medium ${line.approvedCOs !== 0 ? fmtColor(line.approvedCOs) : "text-gray-400"}`}>
                  {line.approvedCOs !== 0 ? (line.approvedCOs > 0 ? "+" : "") + fmt(line.approvedCOs) : "—"}
                </td>
                <td className="px-3 py-2.5 font-semibold text-brand-navy">{fmt(line.revisedBudget)}</td>
                <td className="px-3 py-2.5 text-blue-600">{line.committed > 0 ? fmt(line.committed) : "—"}</td>
                <td className="px-3 py-2.5 text-gray-600">{fmt(line.projected)}</td>
                <td className={`px-3 py-2.5 font-semibold ${fmtColor(-line.variance)}`}>
                  {line.variance >= 0
                    ? <span className="text-green-600">{fmt(line.variance)} under</span>
                    : <span className="text-red-600">{fmt(Math.abs(line.variance))} over</span>
                  }
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(line)} className="text-xs text-brand-orange hover:underline">Edit</button>
                    <button onClick={() => handleDelete(line.id)} className="text-xs text-red-400 hover:underline">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {enriched.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-3 text-xs font-bold text-gray-600 uppercase" colSpan={3}>Totals</td>
                <td className="px-3 py-3">{fmt(totals.original)}</td>
                <td className={`px-3 py-3 ${totals.approvedCOs !== 0 ? fmtColor(totals.approvedCOs) : "text-gray-400"}`}>
                  {totals.approvedCOs !== 0 ? (totals.approvedCOs > 0 ? "+" : "") + fmt(totals.approvedCOs) : "—"}
                </td>
                <td className="px-3 py-3 text-brand-navy">{fmt(totals.revised)}</td>
                <td className="px-3 py-3 text-blue-600">{totals.committed > 0 ? fmt(totals.committed) : "—"}</td>
                <td className="px-3 py-3">{fmt(totals.projected)}</td>
                <td className={`px-3 py-3 ${fmtColor(-totals.variance)}`}>
                  {totals.variance >= 0
                    ? <span className="text-green-600">{fmt(totals.variance)} under</span>
                    : <span className="text-red-600">{fmt(Math.abs(totals.variance))} over</span>
                  }
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit Budget Line" : "Add Budget Line"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Cost Code</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 03-100" value={form.code} onChange={(e) => set("code", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Cost Type</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.cost_type} onChange={(e) => set("cost_type", e.target.value)}>{COST_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Original Budget Amount ($)</label><input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.original_amount} onChange={(e) => set("original_amount", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selected ? "Update" : "Add Line"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
