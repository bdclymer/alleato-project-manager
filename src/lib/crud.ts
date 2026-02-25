import { supabase } from "./supabase";

// Generic CRUD operations for any table

export async function listRecords(
  table: string,
  options?: {
    projectId?: string;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    filters?: Record<string, any>;
    select?: string;
  }
) {
  const select = options?.select || "*";
  let q = supabase.from(table).select(select);

  if (options?.projectId) {
    q = q.eq("project_id", options.projectId);
  }
  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== "") {
        q = q.eq(key, value);
      }
    }
  }
  q = q.order(options?.orderBy || "created_at", {
    ascending: options?.ascending ?? false,
  });
  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;
  if (error) {
    if (error.message?.includes('not found') || error.message?.includes('does not exist') || error.code === '42P01') {
      throw new Error(`Table "${table}" has not been set up yet. Please run the database migration.`);
    }
    throw error;
  }
  return data || [];
}

export async function getRecord(table: string, id: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRecord(table: string, record: Record<string, any>) {
  // Remove empty strings and undefined values
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined && value !== "") {
      cleaned[key] = value;
    }
  }

  const { data, error } = await supabase
    .from(table)
    .insert(cleaned)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecord(
  table: string,
  id: string,
  updates: Record<string, any>
) {
  const cleaned: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "created_at") {
      cleaned[key] = value === "" ? null : value;
    }
  }

  const { data, error } = await supabase
    .from(table)
    .update(cleaned)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function countRecords(
  table: string,
  projectId?: string,
  filters?: Record<string, any>
) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (projectId) q = q.eq("project_id", projectId);
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        q = q.eq(key, value);
      }
    }
  }
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}
