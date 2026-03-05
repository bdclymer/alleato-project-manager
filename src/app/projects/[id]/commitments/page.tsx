"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";

const fmt = (v: number | null) => v == null ? "—" : "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 });

const emptyCommitment = { number: "", title: "", commitment_type: "Subcontract", vendor_name: "", status: "Draft", contract_amount: "", cost_code: "", retainage_percent: "10", executed_date: "", start_date: "", completion_date: "", scope_of_work: "", notes: "" };
const emptyCCO = { number: "", title: "", status: "Draft", amount: "", reason: "", description: "", commitment_id: "" };

export default function CommitmentsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [commitments, setCommitments] = useState<any[]>([]);
  const [ccos, setCCOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commitModal, setCommitModal] = useState(false);
  const [ccoModal, setCcoModal] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<any>(null);
  const [selectedCCO, setSelectedCCO] = useState<any>(null);
  const [commitForm, setCommitForm] = useState(emptyCommitment);
  const [ccoForm, setCcoForm] = useState(emptyCCO);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [c, cco] = await Promise.all([
      supabase.from("commitments").select("*").eq("project_id", projectId).order("number"),
      supabase.from("commitment_change_orders").select("*").eq("project_id", projectId).order("number"),
    ]);
    setCommitments(c.data || []);
    setCCOs(cco.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const setC = (k: string, v: string) => setCommitForm((f) => ({ ...f, [k]: v }));
  const setCCO = (k: string, v: string) => setCcoForm((f) => ({ ...f, [k]: v }));

  const openCreateCommit = () => { setSelectedCommit(null); setCommitForm({ ...emptyCommitment, number: String(commitments.length + 1) }); setCommitModal(true); };
  const openEditCommit = (c: any) => {
    setSelectedCommit(c);
    setCommitForm({ number: c.number || "", title: c.title || "", commitment_type: c.commitment_type || "Subcontract", vendor_name: c.vendor_name || "", status: c.status || "Draft", contract_amount: c.contract_amount != null ? String(c.contract_amount) : "", cost_code: c.cost_code || "", retainage_percent: c.retainage_percent != null ? String(c.retainage_percent) : "10", executed_date: c.executed_date?.substring(0, 10) || "", start_date: c.start_date?.substring(0, 10) || "", completion_date: c.completion_date?.substring(0, 10) || "", scope_of_work: c.scope_of_work || "", notes: c.notes || "" });
    setCommitModal(true);
  };
  const saveCommit = async () => {
    setSaving(true);
    try {
      const payload = { ...commitForm, project_id: projectId, contract_amount: parseFloat(commitForm.contract_amount) || 0, retainage_percent: parseFloat(commitForm.retainage_percent) || 0 };
      if (selectedCommit) await supabase.from("commitments").update(payload).eq("id", selectedCommit.id);
      else await supabase.from("commitments").insert(payload);
      setCommitModal(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const openCreateCCO = (commitmentId?: string) => {
    setSelectedCCO(null);
    setCcoForm({ ...emptyCCO, number: String(ccos.length + 1), commitment_id: commitmentId || "" });
    setCcoModal(true);
  };
  const openEditCCO = (cco: any) => {
    setSelectedCCO(cco);
    setCcoForm({ number: cco.number || "", title: cco.title || "", status: cco.status || "Draft", amount: cco.amount != null ? String(cco.amount) : "", reason: cco.reason || "", description: cco.description || "", commitment_id: cco.commitment_id || "" });
    setCcoModal(true);
  };
  const saveCCO = async () => {
    setSaving(true);
    try {
      const payload = { ...ccoForm, project_id: projectId, amount: parseFloat(ccoForm.amount) || 0, approved_date: ccoForm.status === "approved" ? new Date().toISOString() : null };
      if (selectedCCO) await supabase.from("commitment_change_orders").update(payload).eq("id", selectedCCO.id);
      else await supabase.from("commitment_change_orders").insert(payload);
      setCcoModal(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  // Enrich commitments with CCO totals
  const enriched = commitments.map((c) => {
    const approvedCCOs = ccos.filter((cco) => cco.status === "approved" && cco.commitment_id === c.id).reduce((s, cco) => s + (Number(cco.amount) || 0), 0);
    const pendingCCOs = ccos.filter((cco) => ["draft", "pending"].includes(cco.status) && cco.commitment_id === c.id).reduce((s, cco) => s + (Number(cco.amount) || 0), 0);
    return { ...c, approvedCCOs, pendingCCOs, revisedAmount: (Number(c.contract_amount) || 0) + approvedCCOs };
  });

  const totalOriginal = enriched.reduce((s, c) => s + (Number(c.contract_amount) || 0), 0);
  const totalCCOs = enriched.reduce((s, c) => s + c.approvedCCOs, 0);
  const totalRevised = enriched.reduce((s, c) => s + c.revisedAmount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Commitments</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <div className="flex gap-3">
          <button onClick={() => openCreateCCO()} className="px-4 py-2 border border-brand-orange text-brand-orange text-sm font-semibold rounded-lg hover:bg-orange-50">+ Add CCO</button>
          <button onClick={openCreateCommit} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ New Commitment</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="text-xl font-bold text-brand-navy">{fmt(totalOriginal)}</div><div className="text-xs text-gray-400 mt-1">Original Commitments</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className={`text-xl font-bold ${totalCCOs >= 0 ? "text-red-600" : "text-green-600"}`}>{totalCCOs >= 0 ? "+" : ""}{fmt(totalCCOs)}</div><div className="text-xs text-gray-400 mt-1">Approved CCOs</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="text-xl font-bold text-brand-navy">{fmt(totalRevised)}</div><div className="text-xs text-gray-400 mt-1">Revised Total</div></div>
      </div>

      {/* Commitments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            {["#", "Title", "Type", "Vendor", "Cost Code", "Original", "Approved CCOs", "Revised", "Status", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {enriched.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">No commitments yet.</td></tr>
            ) : enriched.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">#{c.number}</td>
                <td className="px-4 py-3 text-sm font-medium text-brand-navy">{c.title || "Untitled"}</td>
                <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{c.commitment_type}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.vendor_name || "—"}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{c.cost_code || "—"}</td>
                <td className="px-4 py-3 text-sm">{fmt(c.contract_amount)}</td>
                <td className={`px-4 py-3 text-sm font-medium ${c.approvedCCOs >= 0 ? "text-red-600" : "text-green-600"}`}>{c.approvedCCOs !== 0 ? (c.approvedCCOs > 0 ? "+" : "") + fmt(c.approvedCCOs) : "—"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-brand-navy">{fmt(c.revisedAmount)}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openCreateCCO(c.id)} className="text-xs text-gray-400 hover:text-brand-orange">+CCO</button>
                    <button onClick={() => openEditCommit(c)} className="text-xs text-brand-orange hover:underline">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CCOs Table */}
      {ccos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-brand-navy">Commitment Change Orders</h2></div>
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              {["#", "Title", "Vendor / Sub", "Amount", "Status", "Approved", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {ccos.map((cco) => {
                const sub = commitments.find((c) => c.id === cco.commitment_id);
                return (
                  <tr key={cco.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">#{cco.number}</td>
                    <td className="px-4 py-3 text-sm font-medium">{cco.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sub?.vendor_name || cco.vendor || "—"}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${(cco.amount || 0) >= 0 ? "text-red-600" : "text-green-600"}`}>{(cco.amount || 0) >= 0 ? "+" : ""}{fmt(cco.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={cco.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(cco.approved_date)}</td>
                    <td className="px-4 py-3"><button onClick={() => openEditCCO(cco)} className="text-xs text-brand-orange hover:underline">Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Commitment Modal */}
      <Modal open={commitModal} onClose={() => setCommitModal(false)} title={selectedCommit ? "Edit Commitment" : "New Commitment"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Commitment #</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.number} onChange={(e) => setC("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.commitment_type} onChange={(e) => setC("commitment_type", e.target.value)}><option>Subcontract</option><option>Purchase Order</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.title} onChange={(e) => setC("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Vendor / Sub</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.vendor_name} onChange={(e) => setC("vendor_name", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Cost Code</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 03-100" value={commitForm.cost_code} onChange={(e) => setC("cost_code", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Contract Amount ($)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.contract_amount} onChange={(e) => setC("contract_amount", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Retainage %</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.retainage_percent} onChange={(e) => setC("retainage_percent", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.status} onChange={(e) => setC("status", e.target.value)}><option>Draft</option><option>Pending</option><option>Approved</option><option>Executed</option><option>Closed</option><option>Void</option></select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Executed Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.executed_date} onChange={(e) => setC("executed_date", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Scope of Work</label><textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={commitForm.scope_of_work} onChange={(e) => setC("scope_of_work", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setCommitModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={saveCommit} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selectedCommit ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>

      {/* CCO Modal */}
      <Modal open={ccoModal} onClose={() => setCcoModal(false)} title={selectedCCO ? "Edit Commitment CO" : "New Commitment CO"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">CCO #</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.number} onChange={(e) => setCCO("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Commitment / Sub</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.commitment_id} onChange={(e) => setCCO("commitment_id", e.target.value)}><option value="">— Select —</option>{commitments.map((c) => <option key={c.id} value={c.id}>{c.vendor_name || c.title}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.title} onChange={(e) => setCCO("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Amount ($)</label><input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.amount} onChange={(e) => setCCO("amount", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.status} onChange={(e) => setCCO("status", e.target.value)}><option>Draft</option><option>Pending</option><option value="approved">Approved</option><option>Rejected</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Reason</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={ccoForm.reason} onChange={(e) => setCCO("reason", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setCcoModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={saveCCO} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selectedCCO ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
