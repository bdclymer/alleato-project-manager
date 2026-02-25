"use client";

import { useEffect, useState } from "react";
import { getSubmittals } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function SubmittalsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmittals().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Submittals" count={data.length} />
      <DataTable
        data={data}
        searchField="title"
        columns={[
          { key: "number", header: "#", className: "w-20" },
          { key: "title", header: "Title" },
          {
            key: "project",
            header: "Project",
            render: (r) => (
              <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">
                {(r as any).projects?.name || r.project_id}
              </Link>
            ),
          },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "spec_section", header: "Spec Section" },
          { key: "assigned_to", header: "Assigned To" },
          { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
        ]}
      />
    </div>
  );
}
