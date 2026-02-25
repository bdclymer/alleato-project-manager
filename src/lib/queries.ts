import { supabase } from "./supabase";

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getRFIs(projectId?: string) {
  let q = supabase.from("rfis").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getSubmittals(projectId?: string) {
  let q = supabase.from("submittals").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getBudgets(projectId?: string) {
  let q = supabase.from("budgets").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getCommitmentCOs(projectId?: string) {
  let q = supabase.from("commitment_change_orders").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getContractCOs(projectId?: string) {
  let q = supabase.from("contract_change_orders").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getMeetingMinutes(projectId?: string) {
  let q = supabase.from("meeting_minutes").select("*, projects(name)").order("meeting_date", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getAttachments(projectId?: string) {
  let q = supabase.from("documents").select("*, projects(name)").order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getProjectCounts(projectId: string) {
  const [rfis, submittals, budgets, ccos, ctcos, meetings, attachments] = await Promise.all([
    supabase.from("rfis").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("submittals").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("budgets").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("commitment_change_orders").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("contract_change_orders").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("meeting_minutes").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("project_id", projectId),
  ]);
  return {
    rfis: rfis.count || 0,
    submittals: submittals.count || 0,
    budgets: budgets.count || 0,
    commitmentCOs: ccos.count || 0,
    contractCOs: ctcos.count || 0,
    meetings: meetings.count || 0,
    attachments: attachments.count || 0,
  };
}
