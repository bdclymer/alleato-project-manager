import { supabase } from "./supabase";

// ============================================================
// Drawing Sets
// ============================================================

export async function listDrawingSets(projectId: string) {
  const { data, error } = await supabase
    .from("drawing_sets")
    .select("*")
    .eq("project_id", projectId)
    .order("discipline", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createDrawingSet(set: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_sets")
    .insert(set)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDrawingSet(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_sets")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDrawingSet(id: string) {
  const { error } = await supabase.from("drawing_sets").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Drawings (enhanced)
// ============================================================

export async function listDrawings(projectId: string, filters?: {
  discipline?: string;
  setId?: string;
  status?: string;
  search?: string;
  revision?: string;
}) {
  let q = supabase
    .from("drawings")
    .select("*")
    .eq("project_id", projectId)
    .order("drawing_number", { ascending: true });

  if (filters?.discipline) q = q.eq("discipline", filters.discipline);
  if (filters?.setId) q = q.eq("drawing_set_id", filters.setId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.revision) q = q.eq("revision", filters.revision);
  if (filters?.search) {
    q = q.or(`title.ilike.%${filters.search}%,drawing_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getDrawing(id: string) {
  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createDrawing(drawing: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(drawing)) {
    if (value !== undefined && value !== "") cleaned[key] = value;
  }
  const { data, error } = await supabase
    .from("drawings")
    .insert(cleaned)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDrawing(id: string, updates: Record<string, any>) {
  const cleaned: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (key !== "id" && key !== "created_at") {
      cleaned[key] = value === "" ? null : value;
    }
  }
  const { data, error } = await supabase
    .from("drawings")
    .update(cleaned)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDrawing(id: string) {
  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkCreateDrawings(drawings: Record<string, any>[]) {
  const cleaned = drawings.map((d) => {
    const c: Record<string, any> = {};
    for (const [k, v] of Object.entries(d)) {
      if (v !== undefined && v !== "") c[k] = v;
    }
    return c;
  });
  const { data, error } = await supabase
    .from("drawings")
    .insert(cleaned)
    .select();
  if (error) throw error;
  return data || [];
}

export function autoNumberSheet(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(3, "0")}`;
}

// ============================================================
// Drawing Revisions
// ============================================================

export async function listRevisions(drawingId: string) {
  const { data, error } = await supabase
    .from("drawing_revisions")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createRevision(revision: Record<string, any>) {
  // Mark all previous revisions as superseded
  if (revision.drawing_id) {
    await supabase
      .from("drawing_revisions")
      .update({ status: "superseded" })
      .eq("drawing_id", revision.drawing_id)
      .eq("status", "current");
  }

  const { data, error } = await supabase
    .from("drawing_revisions")
    .insert({ ...revision, status: "current" })
    .select()
    .single();
  if (error) throw error;

  // Update drawing's current revision and file_url
  if (revision.drawing_id) {
    await supabase
      .from("drawings")
      .update({
        current_revision_id: data.id,
        revision: revision.revision_number,
        revision_date: revision.revision_date || new Date().toISOString(),
        file_url: revision.file_url,
        file_name: revision.file_name,
        file_size: revision.file_size,
        updated_at: new Date().toISOString(),
      })
      .eq("id", revision.drawing_id);
  }

  return data;
}

// ============================================================
// Drawing Markups
// ============================================================

export async function listMarkups(drawingId: string, revisionId?: string) {
  let q = supabase
    .from("drawing_markups")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: true });

  if (revisionId) q = q.eq("revision_id", revisionId);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createMarkup(markup: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_markups")
    .insert(markup)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMarkup(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_markups")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMarkup(id: string) {
  const { error } = await supabase.from("drawing_markups").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkUpdateMarkupVisibility(drawingId: string, layer: string, visible: boolean) {
  const { error } = await supabase
    .from("drawing_markups")
    .update({ visible, updated_at: new Date().toISOString() })
    .eq("drawing_id", drawingId)
    .eq("layer", layer);
  if (error) throw error;
}

// ============================================================
// Markup Layers
// ============================================================

export async function listLayers(drawingId: string) {
  const { data, error } = await supabase
    .from("drawing_markup_layers")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createLayer(layer: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_markup_layers")
    .insert(layer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleLayerVisibility(id: string, visible: boolean) {
  const { error } = await supabase
    .from("drawing_markup_layers")
    .update({ visible })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Drawing Pins
// ============================================================

export async function listPins(drawingId: string, pinType?: string) {
  let q = supabase
    .from("drawing_pins")
    .select("*")
    .eq("drawing_id", drawingId)
    .order("created_at", { ascending: true });

  if (pinType) q = q.eq("pin_type", pinType);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createPin(pin: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_pins")
    .insert(pin)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePin(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_pins")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePin(id: string) {
  const { error } = await supabase.from("drawing_pins").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Transmittals
// ============================================================

export async function listTransmittals(projectId: string) {
  const { data, error } = await supabase
    .from("drawing_transmittals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTransmittal(id: string) {
  const { data, error } = await supabase
    .from("drawing_transmittals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTransmittal(transmittal: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_transmittals")
    .insert(transmittal)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransmittal(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_transmittals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransmittal(id: string) {
  const { error } = await supabase.from("drawing_transmittals").delete().eq("id", id);
  if (error) throw error;
}

// Transmittal Items
export async function listTransmittalItems(transmittalId: string) {
  const { data, error } = await supabase
    .from("drawing_transmittal_items")
    .select("*")
    .eq("transmittal_id", transmittalId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addTransmittalItem(item: Record<string, any>) {
  const { data, error } = await supabase
    .from("drawing_transmittal_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function acknowledgeTransmittalItem(id: string, acknowledgedBy: string) {
  const { data, error } = await supabase
    .from("drawing_transmittal_items")
    .update({
      acknowledged: true,
      acknowledged_date: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendTransmittal(id: string) {
  const { data, error } = await supabase
    .from("drawing_transmittals")
    .update({
      status: "sent",
      sent_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// Statistics
// ============================================================

export async function getDrawingStats(projectId: string) {
  const [drawings, sets, transmittals] = await Promise.all([
    supabase
      .from("drawings")
      .select("id, status, discipline", { count: "exact" })
      .eq("project_id", projectId),
    supabase
      .from("drawing_sets")
      .select("id", { count: "exact" })
      .eq("project_id", projectId),
    supabase
      .from("drawing_transmittals")
      .select("id", { count: "exact" })
      .eq("project_id", projectId),
  ]);

  const drawingData = drawings.data || [];
  const byStatus: Record<string, number> = {};
  const byDiscipline: Record<string, number> = {};
  drawingData.forEach((d: any) => {
    byStatus[d.status || "unknown"] = (byStatus[d.status || "unknown"] || 0) + 1;
    byDiscipline[d.discipline || "unknown"] = (byDiscipline[d.discipline || "unknown"] || 0) + 1;
  });

  return {
    totalDrawings: drawings.count || 0,
    totalSets: sets.count || 0,
    totalTransmittals: transmittals.count || 0,
    byStatus,
    byDiscipline,
  };
}
