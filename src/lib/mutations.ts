import { supabase } from "./supabase";

// ── Projects ──
export async function createProject(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("projects").insert({ ...data, id, updated_at: new Date().toISOString() });
  if (error) throw error;
  return id;
}

export async function updateProject(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("projects").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ── RFIs ──
export async function createRFI(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("rfis").insert({ ...data, id });
  if (error) throw error;
  return id;
}

export async function updateRFI(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("rfis").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteRFI(id: string) {
  const { error } = await supabase.from("rfis").delete().eq("id", id);
  if (error) throw error;
}

// ── Submittals ──
export async function createSubmittal(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("submittals").insert({ ...data, id });
  if (error) throw error;
  return id;
}

export async function updateSubmittal(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("submittals").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteSubmittal(id: string) {
  const { error } = await supabase.from("submittals").delete().eq("id", id);
  if (error) throw error;
}

// ── Budgets ──
export async function createBudget(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const variance = (data.revised_amount || data.original_amount || 0) - (data.actual_amount || 0);
  const { error } = await supabase.from("budgets").insert({ ...data, id, variance });
  if (error) throw error;
  return id;
}

export async function updateBudget(id: string, data: Record<string, any>) {
  const variance = (data.revised_amount || data.original_amount || 0) - (data.actual_amount || 0);
  const { error } = await supabase.from("budgets").update({ ...data, variance, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

// ── Commitment Change Orders ──
export async function createCommitmentCO(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("commitment_change_orders").insert({ ...data, id });
  if (error) throw error;
  return id;
}

export async function updateCommitmentCO(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("commitment_change_orders").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteCommitmentCO(id: string) {
  const { error } = await supabase.from("commitment_change_orders").delete().eq("id", id);
  if (error) throw error;
}

// ── Contract Change Orders ──
export async function createContractCO(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("contract_change_orders").insert({ ...data, id });
  if (error) throw error;
  return id;
}

export async function updateContractCO(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("contract_change_orders").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteContractCO(id: string) {
  const { error } = await supabase.from("contract_change_orders").delete().eq("id", id);
  if (error) throw error;
}

// ── Meeting Minutes ──
export async function createMeeting(data: Record<string, any>) {
  const id = data.id || crypto.randomUUID();
  const { error } = await supabase.from("meeting_minutes").insert({ ...data, id });
  if (error) throw error;
  return id;
}

export async function updateMeeting(id: string, data: Record<string, any>) {
  const { error } = await supabase.from("meeting_minutes").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from("meeting_minutes").delete().eq("id", id);
  if (error) throw error;
}
