import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "alleato-project-manager";
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || "bdclymer";

interface SystemLog {
  id: number;
  job_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  summary: Record<string, unknown>;
  error_message: string | null;
  run_id: string | null;
  created_at: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

async function fetchSupabase(path: string): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchGitHubWorkflows(): Promise<WorkflowRun[]> {
  if (!GITHUB_TOKEN) return [];

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/runs?per_page=20`,
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
    }));
  } catch {
    return [];
  }
}

async function getDbHealth(): Promise<{ status: string; latency_ms: number; table_counts: Record<string, number> }> {
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

function getLatestByType(logs: SystemLog[]): Record<string, SystemLog> {
  const latest: Record<string, SystemLog> = {};
  for (const log of logs) {
    if (!latest[log.job_type] || new Date(log.created_at) > new Date(latest[log.job_type].created_at)) {
      latest[log.job_type] = log;
    }
  }
  return latest;
}

export async function GET(request: NextRequest) {
  const authPassword = request.headers.get("x-system-password");
  const expected = process.env.SYSTEM_DASHBOARD_PASSWORD;

  if (expected && authPassword !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all data in parallel
  const [systemLogs, workflows, dbHealth] = await Promise.all([
    fetchSupabase("system_logs?order=created_at.desc&limit=100") as Promise<SystemLog[] | null>,
    fetchGitHubWorkflows(),
    getDbHealth(),
  ]);

  const logs = systemLogs || [];
  const latestByType = getLatestByType(logs);

  // Compute uptime from health checks
  const healthLogs = logs.filter((l) => l.job_type === "health");
  const recentHealth = healthLogs.slice(0, 24);
  const healthyCount = recentHealth.filter((h) => h.status === "success").length;
  const uptimePercent = recentHealth.length > 0 ? Math.round((healthyCount / recentHealth.length) * 100) : 100;

  // Sync history (last 10)
  const syncHistory = logs
    .filter((l) => l.job_type === "sync")
    .slice(0, 10)
    .map((l) => ({
      status: l.status,
      completed_at: l.completed_at || l.created_at,
      duration_ms: l.duration_ms,
      total_records: (l.summary as Record<string, unknown>)?.total_records || 0,
    }));

  // Test history (last 10)
  const testHistory = logs
    .filter((l) => l.job_type === "test")
    .slice(0, 10)
    .map((l) => ({
      status: l.status,
      completed_at: l.completed_at || l.created_at,
      duration_ms: l.duration_ms,
      passed: (l.summary as Record<string, unknown>)?.passed || 0,
      failed: (l.summary as Record<string, unknown>)?.failed || 0,
      total: (l.summary as Record<string, unknown>)?.total || 0,
    }));

  // Performance scores from latest lighthouse run
  const latestLighthouse = latestByType["lighthouse"];
  const performanceScores = latestLighthouse?.summary || {};

  // Deployment history
  const deployHistory = logs
    .filter((l) => l.job_type === "deploy")
    .slice(0, 10)
    .map((l) => ({
      status: l.status,
      completed_at: l.completed_at || l.created_at,
      commit: (l.summary as Record<string, unknown>)?.commit || "",
      deploy_url: (l.summary as Record<string, unknown>)?.deploy_url || "",
      actor: (l.summary as Record<string, unknown>)?.actor || "",
    }));

  // Backup info
  const latestBackup = latestByType["backup"];

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    uptime_percent: uptimePercent,

    automation: {
      sync: {
        status: latestByType["sync"]?.status || "unknown",
        last_run: latestByType["sync"]?.completed_at || latestByType["sync"]?.created_at || null,
        duration_ms: latestByType["sync"]?.duration_ms || null,
        schedule: "Every 15 minutes",
      },
      test: {
        status: latestByType["test"]?.status || "unknown",
        last_run: latestByType["test"]?.completed_at || latestByType["test"]?.created_at || null,
        duration_ms: latestByType["test"]?.duration_ms || null,
        schedule: "Every hour",
      },
      backup: {
        status: latestByType["backup"]?.status || "unknown",
        last_run: latestByType["backup"]?.completed_at || latestByType["backup"]?.created_at || null,
        duration_ms: latestByType["backup"]?.duration_ms || null,
        schedule: "Daily at midnight",
        tables: (latestBackup?.summary as Record<string, unknown>)?.tables_backed_up || 0,
        records: (latestBackup?.summary as Record<string, unknown>)?.total_records || 0,
      },
      lighthouse: {
        status: latestByType["lighthouse"]?.status || "unknown",
        last_run: latestByType["lighthouse"]?.completed_at || latestByType["lighthouse"]?.created_at || null,
        duration_ms: latestByType["lighthouse"]?.duration_ms || null,
        schedule: "Every 6 hours",
      },
      deploy: {
        status: latestByType["deploy"]?.status || "unknown",
        last_run: latestByType["deploy"]?.completed_at || latestByType["deploy"]?.created_at || null,
      },
    },

    database: dbHealth,
    performanceScores,
    syncHistory,
    testHistory,
    deployHistory,
    workflows: workflows.slice(0, 10),
  });
}
