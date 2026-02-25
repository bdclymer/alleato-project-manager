"use client";

import { useEffect, useState } from "react";
import { getRFIs } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function RFIsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRFIs().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="RFIs" count={data.length} />
      <DataTable
        data={data}
        searchField="subject"
        columns={[
          { key: "number", header: "#", className: "w-16" },
          { key: "subject", header: "Subject" },
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
          { key: "assigned_to", header: "Assigned To" },
          { key: "created_by", header: "Created By" },
          { key: "due_date", header: "Due", render: (r) => formatDate(r.due_date) },
          { key: "responded_date", header: "Responded", render: (r) => formatDate(r.responded_date) },
        ]}
      />
    </div>
  );
}
