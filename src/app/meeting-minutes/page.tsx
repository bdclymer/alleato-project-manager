"use client";

import { useEffect, useState } from "react";
import { getMeetingMinutes } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function MeetingMinutesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getMeetingMinutes().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Meeting Minutes" count={data.length} />
      <DataTable
        data={data}
        searchField="title"
        columns={[
          { key: "number", header: "#", className: "w-16" },
          {
            key: "title",
            header: "Title",
            render: (r) => (
              <button
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                className="text-left text-brand-orange hover:underline font-medium"
              >
                {r.title || "Untitled Meeting"}
              </button>
            ),
          },
          {
            key: "project",
            header: "Project",
            render: (r) => (
              <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">
                {(r as any).projects?.name || r.project_id}
              </Link>
            ),
          },
          { key: "meeting_date", header: "Date", render: (r) => formatDate(r.meeting_date) },
          { key: "location", header: "Location" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />

      {/* Expanded meeting detail */}
      {expanded && (() => {
        const m = data.find((d) => d.id === expanded);
        if (!m) return null;
        return (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-brand-navy mb-3">{m.title}</h3>
            {m.agenda && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Agenda / Description</h4>
                <p className="text-sm whitespace-pre-wrap">{m.agenda}</p>
              </div>
            )}
            {m.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                <p className="text-sm whitespace-pre-wrap">{m.notes}</p>
              </div>
            )}
            {m.action_items && Array.isArray(m.action_items) && m.action_items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Action Items</h4>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {m.action_items.map((ai: any, i: number) => (
                    <li key={i}>{ai.title || ai.body || JSON.stringify(ai)}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={() => setExpanded(null)} className="mt-4 text-sm text-brand-orange hover:underline">
              Close
            </button>
          </div>
        );
      })()}
    </div>
  );
}
