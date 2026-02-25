import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "alleato-project-manager";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "bdclymer";

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_started_at?: string;
}

// Map workflow names to job types
const WORKFLOW_MAP: Record<string, string> = {
  "CI": "deploy",
  "Deploy to Vercel": "deploy",
  "Automated Testing": "test",
  "Database Backup": "backup",
  "Performance Monitor": "lighthouse",
};

async function fetchGitHubWorkflows(): Promise<WorkflowRun[]> {
  if (!GITHUB_TOKEN) return [];

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/runs?per_page=30`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.workflow_runs || []).map((r: WorkflowRun) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      conclusion: r.conclusion,
      created_at: r.created_at,
      updated_at: r.updated_at,
      html_url: r.html_url,
      run_started_at: r.run_started_at,
    }));
  } catch {
    return [];
  }
}

async function getDbHealth(): Promise<{
  status: string;
  latency_ms: number;
  table_counts: Record<string, number>;
}> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { status: "unconfigured", latency_ms: 0, table_counts: {} };
  }

  const start = Date.now();
  const tables = ["projects", "rfis", "submittals", "budgets", "meeting_minutes"];
  const counts: Record<string, number> = {};

  try {
    await Promise.all(
      tables.map(async (table) => {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0`,
          {
            headers: {
              apikey: SUPABASE_KEY!,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: "count=exact",
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        const count = res.headers.get("content-range");
        counts[table] = count ? parseInt(count.split("/")[1] || "0") : 0;
      })
    );
    return { status: "connected", latency_ms: Date.now() - start, table_counts: counts };
  } catch {
    return { status: "error", latency_ms: Date.now() - start, table_counts: counts };
  }
}

function getLatestRunByWorkflow(runs: WorkflowRun[]): Record<string, WorkflowRun> {
  const latest: Record<string, WorkflowRun> = {};
  for (const run of runs) {
    const type = WORKFLOW_MAP[run.name];
    if (!type) continue;
    if (!latest[type] || new Date(run.created_at) > new Date(latest[type].created_at)) {
      latest[type] = run;
    }
  }
  return latest;
}

function runToStatus(run: WorkflowRun | undefined): string {
  if (!run) return "unknown";
  if (run.status === "in_progress" || run.status === "queued") return "running";
  return run.conclusion === "success" ? "success" : run.conclusion === "failure" ? "failure" : "unknown";
}

function getDuration(run: WorkflowRun): number | null {
  if (!run.run_started_at || !run.updated_at) return null;
  return new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime();
}

export async function GET(request: NextRequest) {
  const authPassword = request.headers.get("x-system-password");
  const expected = process.env.SYSTEM_DASHBOARD_PASSWORD;

  if (expected && authPassword !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch GitHub Actions + DB health in parallel
  const [workflows, dbHealth] = await Promise.all([
    fetchGitHubWorkflows(),
    getDbHealth(),
  ]);

  const latestByType = getLatestRunByWorkflow(workflows);

  // Build automation status from GitHub Actions data
  const automationFromGH = (type: string, schedule: string) => {
    const run = latestByType[type];
    return {
      status: runToStatus(run),
      last_run: run?.updated_at || null,
      duration_ms: run ? getDuration(run) : null,
      schedule,
    };
  };

  // Build history from workflow runs
  const historyFromGH = (workflowName: string) => {
    return workflows
      .filter((r) => r.name === workflowName && r.status === "completed")
      .slice(0, 10)
      .map((r) => ({
        status: r.conclusion === "success" ? "success" : "failure",
        completed_at: r.updated_at,
        duration_ms: getDuration(r),
        html_url: r.html_url,
      }));
  };

  // Health check runs
  const allCompleted = workflows.filter((w) => w.status === "completed");
  const recentRuns = allCompleted.slice(0, 20);
  const successCount = recentRuns.filter((r) => r.conclusion === "success").length;
  const uptimePercent = recentRuns.length > 0 ? Math.round((successCount / recentRuns.length) * 100) : 100;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    uptime_percent: uptimePercent,

    automation: {
      test: automationFromGH("test", "Every hour"),
      backup: {
        ...automationFromGH("backup", "Daily at midnight"),
        tables: 0,
        records: 0,
      },
      lighthouse: automationFromGH("lighthouse", "Every 6 hours"),
      deploy: {
        status: runToStatus(latestByType["deploy"]),
        last_run: latestByType["deploy"]?.updated_at || null,
      },
    },

    database: dbHealth,
    performanceScores: {},

    syncHistory: [],
    testHistory: historyFromGH("Automated Testing"),
    deployHistory: workflows
      .filter((r) => WORKFLOW_MAP[r.name] === "deploy" && r.status === "completed")
      .slice(0, 10)
      .map((r) => ({
        status: r.conclusion === "success" ? "success" : "failure",
        completed_at: r.updated_at,
        commit: "",
        deploy_url: "",
        actor: "",
        html_url: r.html_url,
      })),

    workflows: workflows.slice(0, 15).map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      conclusion: w.conclusion,
      created_at: w.created_at,
      html_url: w.html_url,
    })),
  });
}
