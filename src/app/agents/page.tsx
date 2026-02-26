"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────── */

interface Agent {
  id: string;
  agent_name: string;
  agent_role: string;
  status: string;
  current_task: string | null;
  last_activity: string | null;
  uptime_started: string | null;
  uptime_seconds: number;
}

interface AgentLog {
  id: string;
  agent_name: string;
  log_level: string;
  action: string;
  message: string | null;
  created_at: string;
}

interface AgentMetric {
  agent_name: string;
  memory_usage_mb: number;
  api_calls_count: number;
  llm_tokens_input: number;
  llm_tokens_output: number;
  llm_cost_usd: number;
  errors_count: number;
}

/* ── Helpers ────────────────────────────────────────────── */

function statusDot(status: string) {
  if (status === "online") return "bg-green-400 shadow-green-400/50 shadow-[0_0_6px]";
  if (status === "error") return "bg-red-400 shadow-red-400/50 shadow-[0_0_6px]";
  return "bg-gray-400";
}

function statusBadge(status: string) {
  if (status === "online") return "bg-green-100 text-green-800";
  if (status === "error") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
}

function logLevelColor(level: string) {
  if (level === "error") return "text-red-500";
  if (level === "warn") return "text-amber-500";
  if (level === "info") return "text-blue-500";
  return "text-gray-400";
}

function formatUptime(seconds: number): string {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Component ──────────────────────────────────────────── */

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [metrics, setMetrics] = useState<Record<string, AgentMetric>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const [agentRes, logRes, metricRes] = await Promise.all([
        supabase
          .from("agent_status")
          .select("*")
          .order("agent_name"),
        supabase
          .from("agent_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("agent_metrics")
          .select("*")
          .order("recorded_at", { ascending: false })
          .limit(50),
      ]);

      if (agentRes.error) throw agentRes.error;
      setAgents(agentRes.data || []);
      setLogs(logRes.data || []);

      // Build latest metrics per agent
      const latestMetrics: Record<string, AgentMetric> = {};
      for (const m of metricRes.data || []) {
        if (!latestMetrics[m.agent_name]) {
          latestMetrics[m.agent_name] = m;
        }
      }
      setMetrics(latestMetrics);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load agent data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [load]);

  // Summary stats
  const onlineCount = agents.filter((a) => a.status === "online").length;
  const errorCount = agents.filter((a) => a.status === "error").length;
  const totalApiCalls = Object.values(metrics).reduce((sum, m) => sum + (m.api_calls_count || 0), 0);
  const totalCost = Object.values(metrics).reduce((sum, m) => sum + (Number(m.llm_cost_usd) || 0), 0);

  // Filtered logs
  const filteredLogs = logs.filter((l) => {
    if (selectedAgent && l.agent_name !== selectedAgent) return false;
    if (logFilter !== "all" && l.log_level !== logFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">AI Agent Monitoring</h1>
        <div className="mt-2 h-1 w-16 bg-brand-orange rounded" />
        <p className="text-sm text-gray-500 mt-2">
          Real-time status and metrics for all AI agents
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          {error} — Showing cached data. Tables may need to be created via the migration SQL.
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-2xl font-bold text-brand-navy">{agents.length}</div>
          <div className="text-xs text-gray-400 mt-1">Total Agents</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-2xl font-bold text-green-600">{onlineCount}</div>
          <div className="text-xs text-gray-400 mt-1">Online</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-2xl font-bold text-brand-navy">{totalApiCalls.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">API Calls (Total)</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-2xl font-bold text-brand-navy">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">LLM Cost (Total)</div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <h2 className="text-lg font-semibold text-brand-navy mb-4">Agent Status</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {agents.map((agent) => {
          const m = metrics[agent.agent_name];
          return (
            <button
              key={agent.id}
              onClick={() =>
                setSelectedAgent(
                  selectedAgent === agent.agent_name ? null : agent.agent_name
                )
              }
              className={cn(
                "bg-white rounded-xl shadow-sm border p-5 text-left transition-all hover:shadow-md",
                selectedAgent === agent.agent_name
                  ? "border-brand-orange ring-2 ring-brand-orange/20"
                  : "border-gray-100"
              )}
            >
              {/* Status + Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", statusDot(agent.status))} />
                <div className="min-w-0">
                  <div className="font-semibold text-brand-navy text-sm truncate">
                    {agent.agent_name}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {agent.agent_role}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={cn(
                  "inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize",
                  statusBadge(agent.status)
                )}
              >
                {agent.status}
              </span>

              {/* Details */}
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Last Active</span>
                  <span className="text-gray-700 font-medium">
                    {timeAgo(agent.last_activity)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime</span>
                  <span className="text-gray-700 font-medium">
                    {formatUptime(agent.uptime_seconds)}
                  </span>
                </div>
                {m && (
                  <>
                    <div className="flex justify-between">
                      <span>Memory</span>
                      <span className="text-gray-700 font-medium">
                        {Number(m.memory_usage_mb).toFixed(0)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls</span>
                      <span className="text-gray-700 font-medium">
                        {(m.api_calls_count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>LLM Cost</span>
                      <span className="text-gray-700 font-medium">
                        ${Number(m.llm_cost_usd).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Current Task */}
              {agent.current_task && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-[11px] text-gray-400">Current Task</div>
                  <div className="text-xs text-brand-navy font-medium mt-0.5 line-clamp-2">
                    {agent.current_task}
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {agents.length === 0 && !error && (
          <div className="col-span-full text-center py-12 text-gray-400 text-sm">
            No agents found. Run the migration SQL to seed agent data.
          </div>
        )}
      </div>

      {/* Log Viewer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-navy">
            Agent Logs
            {selectedAgent && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                — {selectedAgent}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {selectedAgent && (
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-xs text-brand-orange hover:underline"
              >
                Clear filter
              </button>
            )}
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 border border-gray-200">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-100 text-gray-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Time</th>
                  <th className="text-left px-3 py-2 font-medium">Agent</th>
                  <th className="text-left px-3 py-2 font-medium">Level</th>
                  <th className="text-left px-3 py-2 font-medium">Action</th>
                  <th className="text-left px-3 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white transition-colors">
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 font-medium text-brand-navy whitespace-nowrap">
                      {log.agent_name}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "font-mono uppercase font-medium",
                          logLevelColor(log.log_level)
                        )}
                      >
                        {log.log_level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-xs truncate">
                      {log.message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              {error
                ? "Log table not yet created. Run the migration SQL first."
                : "No log entries yet."}
            </div>
          )}
        </div>
      </div>

      {/* Footer timestamp */}
      <div className="mt-6 text-xs text-gray-400 text-right">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
