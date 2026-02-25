/**
 * Job Planner API Client
 * Confirmed endpoints from Swagger specs:
 *   v1 (api.jobplanner.com): projects, attachments, rfi, submittals
 *   v2 (api-v2.jobplanner.com): budgets, commitmentchangeorders,
 *       primecontractchangeorders, meetings
 */

const API_V1 = process.env.JOBPLANNER_API_V1 || "https://api.jobplanner.com";
const API_V2 = process.env.JOBPLANNER_API_V2 || "https://api-v2.jobplanner.com";
const API_KEY = process.env.JOBPLANNER_API_KEY;

if (!API_KEY) {
  console.error("Missing JOBPLANNER_API_KEY environment variable");
  process.exit(1);
}

const HEADERS = {
  ApiKey: API_KEY,
  Accept: "application/json",
};

async function fetchJSON(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });

      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1000;
        console.log(`  Rate limited, waiting ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
      }

      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = Math.pow(2, attempt) * 500;
      console.log(`  Attempt ${attempt} failed, retrying in ${wait}ms: ${err.message}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// Most JP endpoints return all records in a single response (no pagination)
async function fetchAll(url) {
  console.log(`  GET ${url.replace(API_V1, "v1:").replace(API_V2, "v2:")}`);
  const data = await fetchJSON(url);

  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  if (data?.data) return data.data;
  if (data?.results) return data.results;
  // Budget endpoint returns a single object with lineItems
  if (data?.lineItems) return [data];
  return [data];
}

// ─── Projects (v1) ───
export async function fetchProjects() {
  console.log("Fetching projects...");
  return fetchAll(`${API_V1}/projects`);
}

// ─── Attachments (v1) ───
export async function fetchAttachments(projectId) {
  return fetchAll(`${API_V1}/projects/${projectId}/attachments`);
}

// ─── RFIs (v1: /rfi not /rfis) ───
export async function fetchRFIs(projectId) {
  return fetchAll(`${API_V1}/projects/${projectId}/rfi`);
}

// ─── Submittals (v1) ───
export async function fetchSubmittals(projectId) {
  return fetchAll(`${API_V1}/projects/${projectId}/submittals`);
}

// ─── Budgets (v2) ───
export async function fetchBudgets(projectId) {
  return fetchAll(`${API_V2}/projects/${projectId}/budgets`);
}

// ─── Commitment Change Orders (v2: /commitmentchangeorders) ───
export async function fetchCommitmentChangeOrders(projectId) {
  return fetchAll(`${API_V2}/projects/${projectId}/commitmentchangeorders`);
}

// ─── Prime Contract Change Orders (v2: /primecontractchangeorders) ───
export async function fetchContractChangeOrders(projectId) {
  return fetchAll(`${API_V2}/projects/${projectId}/primecontractchangeorders`);
}

// ─── Meetings (v2) ───
export async function fetchMeetingMinutes(projectId) {
  return fetchAll(`${API_V2}/projects/${projectId}/meetings`);
}

// ─── Fetch meeting detail (includes agendaItems) ───
export async function fetchMeetingDetail(meetingId) {
  return fetchJSON(`${API_V2}/meetings/${meetingId}`);
}

// ─── Pull everything ───
export async function fetchAllData() {
  const projects = await fetchProjects();
  console.log(`Found ${projects.length} projects.\n`);

  const allData = {
    projects: [],
    attachments: [],
    rfis: [],
    submittals: [],
    budgets: [],
    commitmentChangeOrders: [],
    contractChangeOrders: [],
    meetingMinutes: [],
  };

  for (const project of projects) {
    const pid = project.projectId || project.id;
    const pname = project.projectName || project.name || pid;
    console.log(`\n── Project: ${pname} (${pid}) ──`);

    allData.projects.push(project);

    // Fetch all sub-resources in parallel
    const [attachments, rfis, submittals, budgets, ccos, pccos, meetings] =
      await Promise.allSettled([
        fetchAttachments(pid),
        fetchRFIs(pid),
        fetchSubmittals(pid),
        fetchBudgets(pid),
        fetchCommitmentChangeOrders(pid),
        fetchContractChangeOrders(pid),
        fetchMeetingMinutes(pid),
      ]);

    const extract = (r) => (r.status === "fulfilled" ? r.value : []);
    // Tag attachments with projectId if missing
    const attachmentList = extract(attachments);
    for (const att of attachmentList) {
      if (!att.projectId) att.projectId = pid;
    }
    allData.attachments.push(...attachmentList);
    allData.rfis.push(...extract(rfis));
    allData.submittals.push(...extract(submittals));
    allData.budgets.push(...extract(budgets));
    allData.commitmentChangeOrders.push(...extract(ccos));
    allData.contractChangeOrders.push(...extract(pccos));

    // For meetings, fetch detail for each to get agendaItems
    const meetingList = extract(meetings);
    for (const mtg of meetingList) {
      try {
        const detail = await fetchMeetingDetail(mtg.id);
        allData.meetingMinutes.push({ ...mtg, ...detail });
      } catch {
        allData.meetingMinutes.push(mtg);
      }
    }
  }

  console.log("\n╔══════════════════════════════════╗");
  console.log("║      Data Pull Summary           ║");
  console.log("╠══════════════════════════════════╣");
  console.log(`║ Projects:              ${String(allData.projects.length).padStart(6)} ║`);
  console.log(`║ Attachments:           ${String(allData.attachments.length).padStart(6)} ║`);
  console.log(`║ RFIs:                  ${String(allData.rfis.length).padStart(6)} ║`);
  console.log(`║ Submittals:            ${String(allData.submittals.length).padStart(6)} ║`);
  console.log(`║ Budgets:               ${String(allData.budgets.length).padStart(6)} ║`);
  console.log(`║ Commitment COs:        ${String(allData.commitmentChangeOrders.length).padStart(6)} ║`);
  console.log(`║ Contract COs:          ${String(allData.contractChangeOrders.length).padStart(6)} ║`);
  console.log(`║ Meeting Minutes:       ${String(allData.meetingMinutes.length).padStart(6)} ║`);
  console.log("╚══════════════════════════════════╝");

  return allData;
}
