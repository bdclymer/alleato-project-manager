"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/Modal";

const WEATHER_CONDITIONS = ["Clear", "Partly Cloudy", "Cloudy", "Rain", "Heavy Rain", "Snow", "Fog", "Wind"];

const emptyForm = {
  log_date: new Date().toISOString().substring(0, 10),
  weather: "Clear", temperature_high: "", temperature_low: "",
  crew_count: "0", hours_worked: "0",
  work_performed: "", materials_delivered: "", equipment_used: "",
  visitors: "", safety_incidents: "", delays: "", notes: "",
};

export default function DailyLogsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("daily_logs").select("*").eq("project_id", projectId).order("log_date", { ascending: false });
    setLogs(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [projectId]);

  const openCreate = () => { setForm(emptyForm); setSelected(null); setModalOpen(true); };
  const openDetail = (log: any) => { setSelected(log); setDetailOpen(true); };
  const openEdit = (log: any) => {
    setSelected(log);
    setForm({
      log_date: log.log_date?.substring(0, 10) || "",
      weather: log.weather || "Clear",
      temperature_high: log.temperature_high !== undefined ? String(log.temperature_high) : "",
      temperature_low: log.temperature_low !== undefined ? String(log.temperature_low) : "",
      crew_count: log.crew_count !== undefined ? String(log.crew_count) : "0",
      hours_worked: log.hours_worked !== undefined ? String(log.hours_worked) : "0",
      work_performed: log.work_performed || "",
      materials_delivered: log.materials_delivered || "",
      equipment_used: log.equipment_used || "",
      visitors: log.visitors || "",
      safety_incidents: log.safety_incidents || "",
      delays: log.delays || "",
      notes: log.notes || "",
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form, project_id: projectId,
        crew_count: parseInt(form.crew_count) || 0,
        hours_worked: parseFloat(form.hours_worked) || 0,
        temperature_high: form.temperature_high ? parseInt(form.temperature_high) : null,
        temperature_low: form.temperature_low ? parseInt(form.temperature_low) : null,
      };
      if (selected) await supabase.from("daily_logs").update(payload).eq("id", selected.id);
      else await supabase.from("daily_logs").insert(payload);
      setModalOpen(false);
      await load();
    } catch (e: any) { alert(e.message); }
    setSaving(false);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-brand-navy">Daily Logs</h1><div className="w-12 h-1 bg-brand-orange rounded mt-1" /></div>
        <button onClick={openCreate} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-orange-600">+ New Daily Log</button>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">No daily logs yet. Create the first one.</div>
        ) : logs.map((log) => (
          <div key={log.id} onClick={() => openDetail(log)} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-orange/30 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-brand-navy">{formatDate(log.log_date)}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span>🌤 {log.weather}</span>
                  {log.temperature_high && <span>🌡 {log.temperature_low}°–{log.temperature_high}°F</span>}
                  <span>👷 {log.crew_count} crew</span>
                  <span>⏱ {log.hours_worked} hrs</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); openEdit(log); }} className="text-xs text-brand-orange hover:underline">Edit</button>
            </div>
            {log.work_performed && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">{log.work_performed}</p>
            )}
            {log.safety_incidents && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded inline-block">⚠ Safety: {log.safety_incidents}</div>
            )}
            {log.delays && (
              <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded inline-block ml-1">⏰ Delay: {log.delays}</div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Daily Log — ${formatDate(selected?.log_date)}`} wide>
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Weather</p>
                <p className="font-medium">{selected.weather} {selected.temperature_low && selected.temperature_high ? `· ${selected.temperature_low}°–${selected.temperature_high}°F` : ""}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Labor</p>
                <p className="font-medium">{selected.crew_count} crew · {selected.hours_worked} hrs</p>
              </div>
            </div>
            {selected.work_performed && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Work Performed</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.work_performed}</p></div>}
            {selected.materials_delivered && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Materials Delivered</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.materials_delivered}</p></div>}
            {selected.equipment_used && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Equipment Used</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.equipment_used}</p></div>}
            {selected.visitors && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Visitors</p><p className="text-sm text-gray-700">{selected.visitors}</p></div>}
            {selected.safety_incidents && <div><p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Safety Incidents</p><p className="text-sm text-red-700 bg-red-50 rounded-lg p-3 whitespace-pre-wrap">{selected.safety_incidents}</p></div>}
            {selected.delays && <div><p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-1">Delays</p><p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3 whitespace-pre-wrap">{selected.delays}</p></div>}
            {selected.notes && <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selected.notes}</p></div>}
            <button onClick={() => openEdit(selected)} className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-orange-600">Edit</button>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit Daily Log" : "New Daily Log"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label><input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.log_date} onChange={(e) => set("log_date", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Weather</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.weather} onChange={(e) => set("weather", e.target.value)}>{WEATHER_CONDITIONS.map((w) => <option key={w}>{w}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">High Temp (°F)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.temperature_high} onChange={(e) => set("temperature_high", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Low Temp (°F)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.temperature_low} onChange={(e) => set("temperature_low", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Crew Count</label><input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.crew_count} onChange={(e) => set("crew_count", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Hours Worked</label><input type="number" min="0" step="0.5" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.hours_worked} onChange={(e) => set("hours_worked", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Work Performed</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Describe work completed today..." value={form.work_performed} onChange={(e) => set("work_performed", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Materials Delivered</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} value={form.materials_delivered} onChange={(e) => set("materials_delivered", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Equipment Used</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} value={form.equipment_used} onChange={(e) => set("equipment_used", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Visitors on Site</label><input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.visitors} onChange={(e) => set("visitors", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-red-500 mb-1.5">Safety Incidents</label><textarea className="w-full border border-red-100 rounded-lg px-3 py-2 text-sm" rows={2} value={form.safety_incidents} onChange={(e) => set("safety_incidents", e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-yellow-600 mb-1.5">Delays</label><textarea className="w-full border border-yellow-100 rounded-lg px-3 py-2 text-sm" rows={2} value={form.delays} onChange={(e) => set("delays", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Additional Notes</label><textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg disabled:opacity-60">{saving ? "Saving..." : selected ? "Update" : "Create Log"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
