"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PROJECT_MODULES } from "@/lib/modules";
import { countRecords } from "@/lib/crud";

interface ProjectData {
  id: string;
  name: string;
  number?: string;
  description?: string;
  status?: string;
  stage?: string;
  project_type?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  start_date?: string;
  end_date?: string;
  project_manager?: string;
  superintendent?: string;
  contract_value?: number;
  owner_name?: string;
  architect_name?: string;
}

export default function ProjectDashboard() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("projects").select("*").eq("id", id).single();
      setProject(data);

      // Load counts for all modules
      const moduleCounts: Record<string, number> = {};
      await Promise.all(
        PROJECT_MODULES.filter(m => m.config.table !== "project_directory").map(async (m) => {
          try {
            moduleCounts[m.key] = await countRecords(m.config.table, id);
          } catch {
            moduleCounts[m.key] = 0;
          }
        })
      );
      setCounts(moduleCounts);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return <div className="p-8">Project not found.</div>;

  // Group modules by category for the dashboard
  const categories = [
    {
      title: "Project Management",
      modules: ["rfis", "submittals", "drawings", "specifications", "schedule"],
    },
    {
      title: "Financial",
      modules: ["budget", "prime-contracts", "commitments", "change-events", "commitment-cos", "contract-cos", "owner-invoices", "sub-invoices", "direct-costs"],
    },
    {
      title: "Field",
      modules: ["daily-logs", "punch-list", "meetings"],
    },
    {
      title: "Quality & Safety",
      modules: ["inspections", "observations", "incidents"],
    },
    {
      title: "Documents & Communication",
      modules: ["documents", "photos", "emails", "correspondence", "transmittals"],
    },
    {
      title: "Other",
      modules: ["timesheets", "action-plans", "warranties"],
    },
  ];

  return (
    <div>
      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">{project.name}</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
      </div>

      {/* Project Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-400 block">Status</span>
            <StatusBadge status={project.status} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Location</span>
            <span>{[project.city, project.state].filter(Boolean).join(", ") || "—"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Dates</span>
            <span>{formatDate(project.start_date)} — {formatDate(project.end_date)}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block">Contract Value</span>
            <span className="font-semibold">{formatCurrency(project.contract_value)}</span>
          </div>
          {project.project_manager && (
            <div>
              <span className="text-xs text-gray-400 block">Project Manager</span>
              <span>{project.project_manager}</span>
            </div>
          )}
          {project.superintendent && (
            <div>
              <span className="text-xs text-gray-400 block">Superintendent</span>
              <span>{project.superintendent}</span>
            </div>
          )}
          {project.owner_name && (
            <div>
              <span className="text-xs text-gray-400 block">Owner</span>
              <span>{project.owner_name}</span>
            </div>
          )}
          {project.architect_name && (
            <div>
              <span className="text-xs text-gray-400 block">Architect</span>
              <span>{project.architect_name}</span>
            </div>
          )}
        </div>
        {project.description && (
          <p className="mt-4 text-sm text-gray-500 border-t border-gray-50 pt-3">{project.description}</p>
        )}
      </div>

      {/* Module Dashboard Grid */}
      {categories.map((cat) => (
        <div key={cat.title} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat.title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {cat.modules.map((moduleKey) => {
              const mod = PROJECT_MODULES.find((m) => m.key === moduleKey);
              if (!mod) return null;
              const count = counts[moduleKey] || 0;
              return (
                <Link
                  key={moduleKey}
                  href={`/projects/${id}/${mod.href}`}
                  className="bg-white rounded-lg border border-gray-100 p-4 hover:border-brand-orange/30 hover:shadow-sm transition-all group"
                >
                  <div className="text-2xl font-bold text-brand-navy group-hover:text-brand-orange transition-colors">
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{mod.config.plural}</div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
