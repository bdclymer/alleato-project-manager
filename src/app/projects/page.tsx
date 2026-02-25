"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProjects } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then((p) => { setProjects(p); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="Projects" count={projects.length} />
      <DataTable
        data={projects}
        searchField="name"
        columns={[
          {
            key: "name",
            header: "Project Name",
            render: (row) => (
              <Link href={`/projects/${row.id}`} className="text-brand-orange hover:underline font-medium">
                {row.name || "Untitled"}
              </Link>
            ),
          },
          { key: "city", header: "Location", render: (row) => [row.city, row.state].filter(Boolean).join(", ") || "—" },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
          { key: "start_date", header: "Start", render: (row) => formatDate(row.start_date) },
          { key: "end_date", header: "End", render: (row) => formatDate(row.end_date) },
        ]}
      />
    </div>
  );
}
