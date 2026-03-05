"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { formatDate } from "@/lib/utils";

const fmt = (v: number | null) => v == null ? "—" : "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 0 });

const emptyContract = { number: "", title: "", owner_company: "", status: "Draft", contract_amount: "", retainage_percent: "10", executed_date: "", start_date: "", completion_date: "", description: "", notes: "" };
const emptyCO = { number: "", title: "", status: "Draft", amount: "", reason: "", description: "" };

export default function PrimeContractsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [contracts, setContracts] = useState<any[]>([]);
  const [cos, setCOs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractModal, setContractModal] = useState(false);
  const [coModal, setCoModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedCO, setSelectedCO] = useState<any>(null);
  const [contractForm, setContractForm] = useState(emptyContract);
  const [coForm, setCoForm] = useState(emptyCO);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [c, co] = await Promise.all([
      supabase.from("prime_contracts").select("*").eq("project_id", projectId).order("created_at"),
      supabase.from("contract_change_orders").select("*").eq("project_id", projectId).order("number"),
    ]);
    setContracts(c.data || []);
    setCOs(co.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const setC = (k: string, v: string) => setContractForm((f) => ({ ...f, [k]: v }));
  const setCO = (k: string, v: string) => setCoForm((f) => ({ ...f, [k]: v }));

  const openCreateContract = () => { setSelectedContract(null); setContractForm(emptyContract); setContractModal(true); };
  const openEditContract = (c: any) => {
    setSelectedContract(c);
    setContractForm({ number: c.number || "", title: c.title || "", owner_company: c.owner_company || "", status: c.status || "Draft", contract_amount: c.contract_amount != null ? String(c.contract_amount) : "", retainage_percent: c.retainage_percent != null ? String(c.retainage_percent) : "10", executed_date: c.executed_date?.substring(0, 10) || "", start_date: c.start_date?.substring(0, 10) || "", completion_date: c.completion_date?.substring(0, 10) || "", description: c.description || "", notes: c.notes || "" });
    setContractModal(true);
  };
  const saveContract = async () => {
    setSaving(true);
    try {
      const payload = { ...contractForm, project_id: projectId, contract_amount: parseFloat(contractForm.contract_amount) || 0, retainage_percent: parseFloat(contractForm.retainage_percent) || 0 };
      if (selectedContract) await supabase.from("prime_contracts").update(payload).eq("id", selectedContract.id);
      else await supabase.from("prime_contracts").insert(payload);
      setContractModal(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const openCreateCO = () => {
    const num = cos.length + 1;
    setSelectedCO(null);
    setCoForm({ ...emptyCO, number: String(num) });
    setCoModal(true);
  };
  const openEditCO = (co: any) => {
    setSelectedCO(co);
    setCoForm({ number: co.number || "", title: co.title || "", status: co.status || "Draft", amount: co.amount != null ? String(co.amount) : "", reason: co.reason || "", description: co.description || "" });
    setCoModal(true);
  };
  const saveCO = async () => {
    setSaving(true);
    try {
      const payload = { ...coForm, project_id: projectId, amount: parseFloat(coForm.amount) || 0, approved_date: coForm.status === "approved" ? new Date().toISOString().substring(0, 10) : null };
      if (selectedCO) await supabase.from("contract_change_orders").update(payload).eq("id", selectedCO.id);
      else await supabase.from("contract_change_orders").insert(payload);
      setCoModal(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  // Compute revised amounts for each contract
  const enriched = contracts.map((c) => {
    const approvedCOs = cos.filter((co) => co.status === "approved" && co.contract_id === c.id).reduce((s, co) => s + (Number(co.amount) || 0), 0);
    const pendingCOs = cos.filter((co) => ["draft", "pending"].includes(co.status) && co.contract_id === c.id).reduce((s, co) => s + (Number(co.amount) || 0), 0);
    return { ...c, approvedCOs, pendingCOs, revisedAmount: (Number(c.contract_amount) || 0) + approvedCOs };
  });

  const totalOriginal = enriched.reduce((s, c) => s + (Number(c.contract_amount) || 0), 0);
  const totalApprovedCOs = enriched.reduce((s, c) => s + c.approvedCOs, 0);
  const totalRevised = enriched.reduce((s, c) => s + c.revisedAmount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Prime Contracts</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <div className="flex gap-3">
          <button onClick={openCreateCO} className="px-4 py-2 border border-brand-orange text-brand-orange text-sm font-semibold rounded-lg hover:bg-orange-50">+ Add Contract CO</button>
          <button onClick={openCreateContract} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ New Contract</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="text-xl font-bold text-brand-navy">{fmt(totalOriginal)}</div><div className="text-xs text-gray-400 mt-1">Original Contract</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className={`text-xl font-bold ${totalApprovedCOs >= 0 ? "text-red-600" : "text-green-600"}`}>{totalApprovedCOs >= 0 ? "+" : ""}{fmt(totalApprovedCOs)}</div><div className="text-xs text-gray-400 mt-1">Approved COs</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"><div className="text-xl font-bold text-brand-navy">{fmt(totalRevised)}</div><div className="text-xs text-gray-400 mt-1">Revised Contract Amount</div></div>
      </div>

      {/* Contracts */}
      <div className="space-y-4 mb-8">
        {contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No prime contracts yet.</div>
        ) : enriched.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-gray-400">#{c.number}</span>
                  <StatusBadge status={c.status} />
                </div>
                <h3 className="font-semibold text-brand-navy">{c.title || "Untitled"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.owner_company}</p>
              </div>
              <button onClick={() => openEditContract(c)} className="text-xs text-brand-orange hover:underline">Edit</button>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
              <div><p className="text-xs text-gray-400">Original Amount</p><p className="font-semibold text-brand-navy">{fmt(c.contract_amount)}</p></div>
              <div><p className="text-xs text-gray-400">Approved COs</p><p className={`font-semibold ${c.approvedCOs >= 0 ? "text-red-600" : "text-green-600"}`}>{c.approvedCOs !== 0 ? (c.approvedCOs > 0 ? "+" : "") + fmt(c.approvedCOs) : "—"}</p></div>
              <div><p className="text-xs text-gray-400">Revised Amount</p><p className="font-semibold text-brand-navy">{fmt(c.revisedAmount)}</p></div>
              <div><p className="text-xs text-gray-400">Retainage</p><p className="font-semibold">{c.retainage_percent}%</p></div>
            </div>
            {(c.start_date || c.completion_date) && (
              <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-gray-500">
                {c.start_date && <span>Start: {formatDate(c.start_date)}</span>}
                {c.completion_date && <span>Completion: {formatDate(c.completion_date)}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contract COs Table */}
      {cos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-brand-navy">Contract Change Orders</h2></div>
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              {["#", "Title", "Reason", "Amount", "Status", "Approved", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {cos.map((co) => (
                <tr key={co.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">#{co.number}</td>
                  <td className="px-4 py-3 text-sm font-medium">{co.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{co.reason || "—"}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${(co.amount || 0) >= 0 ? "text-red-600" : "text-green-600"}`}>{(co.amount || 0) >= 0 ? "+" : ""}{fmt(co.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={co.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(co.approved_date)}</td>
                  <td className="px-4 py-3"><button onClick={() => openEditCO(co)} className="text-xs text-brand-orange hover:underline">Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contract Modal */}
      <Modal open={contractModal} onClose={() => setContractModal(false)} title={selectedContract ? "Edit Prime Contract" : "New Prime Contract"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Contract #</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.number} onChange={(e) => setC("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.status} onChange={(e) => setC("status", e.target.value)}><option>Draft</option><option>Pending</option><option>Approved</option><option>Executed</option><option>Closed</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.title} onChange={(e) => setC("title", e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Owner Company</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.owner_company} onChange={(e) => setC("owner_company", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Contract Amount ($)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.contract_amount} onChange={(e) => setC("contract_amount", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Retainage %</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.retainage_percent} onChange={(e) => setC("retainage_percent", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Executed Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.executed_date} onChange={(e) => setC("executed_date", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.start_date} onChange={(e) => setC("start_date", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Completion Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.completion_date} onChange={(e) => setC("completion_date", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label><textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={contractForm.notes} onChange={(e) => setC("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setContractModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={saveContract} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selectedContract ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>

      {/* CO Modal */}
      <Modal open={coModal} onClose={() => setCoModal(false)} title={selectedCO ? "Edit Contract CO" : "New Contract CO"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">CO #</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.number} onChange={(e) => setCO("number", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.status} onChange={(e) => setCO("status", e.target.value)}><option>Draft</option><option>Pending</option><option value="approved">Approved</option><option>Rejected</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.title} onChange={(e) => setCO("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Amount ($) — use negative for deduct</label><input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.amount} onChange={(e) => setCO("amount", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Reason</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.reason} onChange={(e) => setCO("reason", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label><textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={coForm.description} onChange={(e) => setCO("description", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setCoModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={saveCO} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selectedCO ? "Update" : "Create"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
