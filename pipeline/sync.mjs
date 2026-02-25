/**
 * Data Sync: Job Planner → Supabase
 * Maps real Job Planner API schemas to our Supabase tables.
 * Financial amounts are stored in cents in JP; converted to dollars here.
 */

import { fetchAllData } from "./jobplanner-client.mjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const cents = (v) => (v != null ? v / 100 : null);

function mapProject(r) {
  return {
    id: String(r.projectId),
    name: r.projectName,
    number: r.projectId?.toString(),
    description: r.notes || null,
    status: r.status,
    address: [r.address1, r.address2].filter(Boolean).join(", ") || null,
    city: r.city,
    state: r.state,
    zip: r.zip,
    start_date: r.startDate,
    end_date: r.endDate,
    raw_data: r,
  };
}

function mapAttachment(r, fallbackProjectId) {
  const pid = r.projectId || fallbackProjectId;
  if (!pid) return null; // skip if no project_id
  return {
    id: r.guid || String(r.entryId || `att-${pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    project_id: String(pid),
    name: r.name,
    file_name: r.name,
    file_url: r.url || r.thumbUrl,
    file_size: r.size,
    content_type: null,
    category: r.folder,
    uploaded_by: null,
    raw_data: r,
  };
}

function mapRFI(r) {
  return {
    id: String(r.rfiId),
    project_id: String(r.projectId),
    number: r.number,
    subject: r.title,
    question: r.question,
    answer: null,
    status: rfiStatusLabel(r.status),
    priority: null,
    assigned_to: r.assigneeList?.[0]?.name || null,
    created_by: r.requestedBy?.name || null,
    due_date: r.dueDate,
    responded_date: r.closedOn,
    raw_data: r,
  };
}

function rfiStatusLabel(code) {
  const map = { 0: "Draft", 1: "Open", 2: "Closed" };
  return map[code] || String(code);
}

function mapSubmittal(r) {
  return {
    id: String(r.submittalId),
    project_id: String(r.projectId),
    number: r.submittalNumber,
    title: r.title,
    description: r.notes,
    status: submittalStatusLabel(r.statusId),
    spec_section: null,
    submitted_by: null,
    assigned_to: r.ballInCourtApproverList?.[0]?.name || null,
    due_date: null,
    approved_date: null,
    raw_data: r,
  };
}

function submittalStatusLabel(code) {
  const map = { 0: "Draft", 1: "Open", 2: "Approved", 3: "Rejected", 4: "Revise & Resubmit" };
  return map[code] || String(code);
}

function mapBudget(r) {
  return {
    id: String(r.id),
    project_id: String(r.projectId),
    code: null,
    description: null,
    original_amount: cents(r.contractAmount),
    revised_amount: cents(r.revisedBudget),
    committed_amount: cents(r.committedCosts),
    actual_amount: cents(r.projectedCosts),
    variance: cents((r.revisedBudget || r.budgetedCost || 0) - (r.projectedCosts || 0)),
    category: null,
    raw_data: r,
  };
}

function mapCommitmentCO(r) {
  return {
    id: String(r.id),
    project_id: String(r.projectId),
    number: r.number,
    title: r.description,
    description: r.changeReason,
    status: coStatusLabel(r.statusId),
    amount: cents(r.totalAmount || r.amount),
    vendor: r.contractedContact?.name || null,
    commitment_id: r.commitmentId ? String(r.commitmentId) : null,
    reason: r.changeReason,
    approved_date: r.statusId === 8 ? r.createdOn : null,
    raw_data: r,
  };
}

function mapContractCO(r) {
  return {
    id: String(r.id),
    project_id: String(r.projectId),
    number: r.number,
    title: r.description,
    description: r.changeReason,
    status: coStatusLabel(r.statusId),
    amount: cents(r.totalAmount || r.amount),
    contract_id: r.primeContractId ? String(r.primeContractId) : null,
    reason: r.changeReason,
    approved_date: r.statusId === 8 ? r.createdOn : null,
    raw_data: r,
  };
}

function coStatusLabel(code) {
  const map = { 1: "Draft", 2: "Pending", 4: "Rejected", 8: "Approved" };
  return map[code] || String(code);
}

function mapMeeting(r) {
  return {
    id: String(r.id),
    project_id: String(r.projectId),
    number: r.number?.toString(),
    title: r.name,
    meeting_date: r.date,
    location: r.location,
    attendees: r.attendees || r.attendeeIds,
    agenda: r.description,
    notes: r.agendaItems?.map((a) => `${a.title || ""}: ${a.body || ""}`).join("\n") || null,
    action_items: r.agendaItems?.filter((a) => a.isActionItem) || null,
    status: meetingStatusLabel(r.statusId),
    created_by: r.createdById ? String(r.createdById) : null,
    raw_data: r,
  };
}

function meetingStatusLabel(code) {
  const map = { 1: "Draft", 2: "In Progress", 4: "Closed" };
  return map[code] || String(code);
}

function dedup(records) {
  const seen = new Set();
  return records.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

async function upsertBatch(table, records) {
  if (records.length === 0) {
    console.log(`  ${table}: 0 records (skipped).`);
    return 0;
  }

  const batchSize = 500;
  let total = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ERROR ${table}: ${err.substring(0, 300)}`);
    } else {
      total += batch.length;
    }
  }

  console.log(`  ${table}: ${total} records synced.`);
  return total;
}

export async function syncAll() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║  Job Planner → Supabase Data Sync         ║");
  console.log("╚════════════════════════════════════════════╝\n");

  const data = await fetchAllData();

  console.log("\nUpserting to Supabase...\n");

  // Projects first (FK parent)
  await upsertBatch("projects", data.projects.map(mapProject));

  // Sub-resources in parallel
  await Promise.all([
    upsertBatch("attachments", dedup(data.attachments.map((a) => mapAttachment(a, null)).filter(Boolean))),
    upsertBatch("rfis", data.rfis.map(mapRFI)),
    upsertBatch("submittals", data.submittals.map(mapSubmittal)),
    upsertBatch("budgets", data.budgets.map(mapBudget)),
    upsertBatch("commitment_change_orders", data.commitmentChangeOrders.map(mapCommitmentCO)),
    upsertBatch("contract_change_orders", data.contractChangeOrders.map(mapContractCO)),
    upsertBatch("meeting_minutes", data.meetingMinutes.map(mapMeeting)),
  ]);

  console.log("\nSync complete.");
}

syncAll().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
