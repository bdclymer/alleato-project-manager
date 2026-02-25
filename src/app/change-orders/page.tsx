"use client";

import { useEffect, useState } from "react";
import { getCommitmentCOs, getContractCOs } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function ChangeOrdersPage() {
  const [ccos, setCcos] = useState<any[]>([]);
  const [ctcos, setCtcos] = useState<any[]>([]);
  const [tab, setTab] = useState<"commitment" | "contract">("commitment");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCommitmentCOs(), getContractCOs()]).then(([c, ct]) => {
      setCcos(c);
      setCtcos(ct);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  const ccoTotal = ccos.reduce((s, r) => s + (r.amount || 0), 0);
  const ctcoTotal = ctcos.reduce((s, r) => s + (r.amount || 0), 0);

  const data = tab === "commitment" ? ccos : ctcos;

  return (
    <div>
      <PageHeader title="Change Orders" count={ccos.length + ctcos.length} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Commitment COs" value={ccos.length} sub={formatCurrency(ccoTotal)} />
        <StatCard label="Contract COs" value={ctcos.length} sub={formatCurrency(ctcoTotal)} />
        <StatCard label="Total COs" value={ccos.length + ctcos.length} />
        <StatCard label="Total Amount" value={formatCurrency(ccoTotal + ctcoTotal)} />
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("commitment")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "commitment" ? "bg-brand-orange text-white" : "bg-white text-gray-500 hover:bg-gray-100"
          }`}
        >
          Commitment COs ({ccos.length})
        </button>
        <button
          onClick={() => setTab("contract")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "contract" ? "bg-brand-orange text-white" : "bg-white text-gray-500 hover:bg-gray-100"
          }`}
        >
          Contract COs ({ctcos.length})
        </button>
      </div>

      <DataTable
        data={data}
        searchField="title"
        columns={[
          { key: "number", header: "#" },
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
          ...(tab === "commitment" ? [{ key: "vendor", header: "Vendor" } as any] : []),
          { key: "amount", header: "Amount", render: (r: any) => formatCurrency(r.amount), className: "text-right" },
          { key: "status", header: "Status", render: (r: any) => <StatusBadge status={r.status} /> },
          { key: "reason", header: "Reason" },
          { key: "approved_date", header: "Approved", render: (r: any) => formatDate(r.approved_date) },
        ]}
      />
    </div>
  );
}
