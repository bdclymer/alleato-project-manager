"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

interface AutomationJob {
  status: string;
  last_run: string | null;
  duration_ms: number | null;
  schedule: string;
  tables?: number;
  records?: number;
}

interface SyncEntry {
  status: string;
  completed_at: string;
  duration_ms: number | null;
  total_records: number;
}

interface TestEntry {
  status: string;
  completed_at: string;
  duration_ms: number | null;
  passed: number;
  failed: number;
  total: number;
}

interface DeployEntry {
  status: string;
  completed_at: string;
  commit: string;
  deploy_url: string;
  actor: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
}

interface SystemStatus {
  timestamp: string;
  uptime_percent: number;
  automation: {
    sync: AutomationJob;
    test: AutomationJob;
    backup: AutomationJob & { tables: number; records: number };
    lighthouse: AutomationJob;
    deploy: { status: string; last_run: string | null };
  };
  database: {
    status: string;
    latency_ms: number;
    table_counts: Record<string, number>;
  };
  performanceScores: Record<string, number>;
  syncHistory: SyncEntry[];
  testHistory: TestEntry[];
  deployHistory: DeployEntry[];
  workflows: WorkflowRun[];
}

// ── Utility Components ───────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-500",
    ok: "bg-green-500",
    connected: "bg-green-500",
    healthy: "bg-green-500",
    running: "bg-blue-500 animate-pulse",
    in_progress: "bg-blue-500 animate-pulse",
    failure: "bg-red-500",
    error: "bg-red-500",
    partial: "bg-amber-500",
    unknown: "bg-gray-400",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || colors.unknown}`}
    />
  );
}

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    ok: "bg-green-100 text-green-800",
    connected: "bg-green-100 text-green-800",
    running: "bg-blue-100 text-blue-800",
    in_progress: "bg-blue-100 text-blue-800",
    failure: "bg-red-100 text-red-800",
    error: "bg-red-100 text-red-800",
    partial: "bg-amber-100 text-amber-800",
    unknown: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide ${styles[status] || styles.unknown}`}
    >
      {status}
    </span>
  );
}

function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm ${className}`}>
      <div className="px-5 py-3 border-b flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h3 className="text-sm font-semibold text-brand-navy">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color = "text-brand-navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function TimeAgo({ date }: { date: string | null }) {
  if (!date) return <span className="text-gray-400">Never</span>;
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let text = "";
  if (diffMin < 1) text = "Just now";
  else if (diffMin < 60) text = `${diffMin}m ago`;
  else if (diffHr < 24) text = `${diffHr}h ago`;
  else text = `${diffDay}d ago`;

  return (
    <span className="text-gray-500" title={d.toLocaleString()}>
      {text}
    </span>
  );
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Score Ring ───────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 90 ? "text-green-500" : score >= 70 ? "text-amber-500" : "text-red-500";
  const strokeColor =
    score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="4" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>
          {score}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────

export default function SystemDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "sync" | "tests" | "deploys">("overview");

  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/system/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        setStoredPassword(password);
      } else {
        setAuthError("Invalid password");
      }
    } catch {
      setAuthError("Authentication failed");
    }
  };

  const fetchStatus = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const res = await fetch("/api/system/status", {
        headers: { "x-system-password": storedPassword },
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [authenticated, storedPassword]);

  useEffect(() => {
    if (authenticated) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, fetchStatus]);

  // ── Login Screen ──

  if (!authenticated) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-1">System Dashboard</h2>
          <div className="w-10 h-1 bg-brand-orange rounded mb-6" />
          <p className="text-sm text-gray-500 mb-6">
            Enter the system password to access monitoring data.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
          {authError && <p className="text-sm text-red-500 mb-3">{authError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-2 bg-brand-orange text-white rounded-lg text-sm font-medium hover:bg-brand-orange-dark transition-colors"
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ──

  const auto = status?.automation;
  const db = status?.database;
  const perf = status?.performanceScores || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">System Dashboard</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
          <p className="text-xs text-gray-400 mt-1">Autonomous self-maintaining system</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          )}
          <span className="text-xs text-gray-400">
            {status?.timestamp
              ? `Updated ${new Date(status.timestamp).toLocaleTimeString()}`
              : "Loading..."}
          </span>
          <button
            onClick={fetchStatus}
            className="px-3 py-1.5 text-xs bg-brand-navy text-white rounded-lg hover:bg-brand-navy-light transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {!status ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${
                  (status.uptime_percent || 100) >= 99 ? "bg-green-500" :
                  (status.uptime_percent || 100) >= 95 ? "bg-amber-500" : "bg-red-500"
                }`} />
                <span className="text-xs text-gray-500 font-medium">Uptime</span>
              </div>
              <p className="text-3xl font-bold text-brand-navy">{status.uptime_percent || 100}%</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={db?.status || "unknown"} />
                <span className="text-xs text-gray-500 font-medium">Database</span>
              </div>
              <p className="text-3xl font-bold text-brand-navy">{db?.latency_ms || 0}ms</p>
              <p className="text-[10px] text-gray-400">{db?.status || "unknown"}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={auto?.sync.status || "unknown"} />
                <span className="text-xs text-gray-500 font-medium">Last Sync</span>
              </div>
              <p className="text-lg font-bold text-brand-navy">
                <TimeAgo date={auto?.sync.last_run || null} />
              </p>
              <p className="text-[10px] text-gray-400">{auto?.sync.schedule}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={auto?.deploy.status || "unknown"} />
                <span className="text-xs text-gray-500 font-medium">Last Deploy</span>
              </div>
              <p className="text-lg font-bold text-brand-navy">
                <TimeAgo date={auto?.deploy.last_run || null} />
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
            {(["overview", "sync", "tests", "deploys"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Automation Jobs */}
              <Card title="Automation Jobs" icon="&#9881;">
                <div className="space-y-3">
                  {auto &&
                    (
                      [
                        ["Job Planner Sync", auto.sync, "sync"],
                        ["Playwright Tests", auto.test, "test"],
                        ["Database Backup", auto.backup, "backup"],
                        ["Lighthouse Audit", auto.lighthouse, "lighthouse"],
                      ] as [string, AutomationJob, string][]
                    ).map(([name, job]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2.5">
                          <StatusDot status={job.status} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{name}</p>
                            <p className="text-[10px] text-gray-400">{job.schedule}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge status={job.status} />
                          <p className="text-[10px] text-gray-400 mt-1">
                            <TimeAgo date={job.last_run} />
                            {job.duration_ms ? ` (${formatDuration(job.duration_ms)})` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Database Health */}
              <Card title="Database Health" icon="&#128451;">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <StatusDot status={db?.status || "unknown"} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {db?.status || "unknown"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Latency: {db?.latency_ms || 0}ms
                    </span>
                  </div>
                  {db?.table_counts && Object.keys(db.table_counts).length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(db.table_counts).map(([table, count]) => (
                        <div
                          key={table}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-xs text-gray-600 capitalize">
                            {table.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs font-bold text-brand-navy">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Performance Scores */}
              <Card title="Performance Scores" icon="&#9889;">
                {perf && Object.keys(perf).length > 0 ? (
                  <div className="flex items-center justify-around py-2">
                    {perf.performance !== undefined && (
                      <ScoreRing score={perf.performance as number} label="Performance" />
                    )}
                    {perf.accessibility !== undefined && (
                      <ScoreRing score={perf.accessibility as number} label="Accessibility" />
                    )}
                    {perf.bestPractices !== undefined && (
                      <ScoreRing score={perf.bestPractices as number} label="Best Practices" />
                    )}
                    {perf.seo !== undefined && (
                      <ScoreRing score={perf.seo as number} label="SEO" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No performance data yet. Lighthouse audits run every 6 hours.
                  </p>
                )}
              </Card>

              {/* Backup Status */}
              <Card title="Backup Status" icon="&#128190;">
                {auto?.backup ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge status={auto.backup.status} />
                      <span className="text-sm text-gray-700">
                        <TimeAgo date={auto.backup.last_run} />
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Stat label="Tables" value={auto.backup.tables || 0} />
                      <Stat label="Records" value={auto.backup.records || 0} />
                      <Stat
                        label="Duration"
                        value={formatDuration(auto.backup.duration_ms)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Schedule: {auto.backup.schedule}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No backup data available</p>
                )}
              </Card>

              {/* GitHub Actions */}
              <Card title="GitHub Actions" icon="&#128640;" className="lg:col-span-2">
                {status.workflows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left py-2 pr-4">Workflow</th>
                          <th className="text-left py-2 pr-4">Status</th>
                          <th className="text-left py-2 pr-4">Time</th>
                          <th className="text-right py-2">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.workflows.map((wf) => (
                          <tr key={wf.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium text-gray-800">
                              {wf.name}
                            </td>
                            <td className="py-2 pr-4">
                              <Badge status={wf.conclusion || wf.status} />
                            </td>
                            <td className="py-2 pr-4 text-xs text-gray-500">
                              <TimeAgo date={wf.created_at} />
                            </td>
                            <td className="py-2 text-right">
                              <a
                                href={wf.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-orange hover:underline"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No workflow data available. Workflows log results after each run.
                  </p>
                )}
              </Card>
            </div>
          )}

          {activeTab === "sync" && (
            <Card title="Sync History" icon="&#128260;">
              {status.syncHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-right py-2">Records</th>
                        <th className="text-right py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.syncHistory.map((entry, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">
                            <Badge status={entry.status} />
                          </td>
                          <td className="py-2 text-xs text-gray-600">
                            {new Date(entry.completed_at).toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-mono text-xs">
                            {entry.total_records}
                          </td>
                          <td className="py-2 text-right text-xs text-gray-500">
                            {formatDuration(entry.duration_ms)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  No sync history yet. The Job Planner sync runs every 15 minutes via GitHub Actions.
                </p>
              )}
            </Card>
          )}

          {activeTab === "tests" && (
            <Card title="Test History" icon="&#129514;">
              {status.testHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Stat
                      label="Latest Passed"
                      value={status.testHistory[0]?.passed || 0}
                      color="text-green-600"
                    />
                    <Stat
                      label="Latest Failed"
                      value={status.testHistory[0]?.failed || 0}
                      color={
                        (status.testHistory[0]?.failed || 0) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    />
                    <Stat
                      label="Total Tests"
                      value={status.testHistory[0]?.total || 0}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 border-b">
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Time</th>
                          <th className="text-center py-2">Passed</th>
                          <th className="text-center py-2">Failed</th>
                          <th className="text-right py-2">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.testHistory.map((entry, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2">
                              <Badge status={entry.status} />
                            </td>
                            <td className="py-2 text-xs text-gray-600">
                              {new Date(entry.completed_at).toLocaleString()}
                            </td>
                            <td className="py-2 text-center text-xs font-medium text-green-600">
                              {entry.passed}
                            </td>
                            <td className="py-2 text-center text-xs font-medium text-red-600">
                              {entry.failed}
                            </td>
                            <td className="py-2 text-right text-xs text-gray-500">
                              {formatDuration(entry.duration_ms)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  No test history yet. Playwright tests run hourly via GitHub Actions.
                </p>
              )}
            </Card>
          )}

          {activeTab === "deploys" && (
            <Card title="Deployment History" icon="&#128640;">
              {status.deployHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Time</th>
                        <th className="text-left py-2">Commit</th>
                        <th className="text-left py-2">Actor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.deployHistory.map((entry, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">
                            <Badge status={entry.status} />
                          </td>
                          <td className="py-2 text-xs text-gray-600">
                            {new Date(entry.completed_at).toLocaleString()}
                          </td>
                          <td className="py-2">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {(entry.commit || "").substring(0, 7)}
                            </code>
                          </td>
                          <td className="py-2 text-xs text-gray-600">{entry.actor || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  No deployment history yet. Deploys trigger on push to main.
                </p>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
