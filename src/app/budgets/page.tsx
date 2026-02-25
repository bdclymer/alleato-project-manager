"use client";

import { useEffect, useState } from "react";
import { getBudgets } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function BudgetsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBudgets().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;

  const totalOriginal = data.reduce((s, r) => s + (r.original_amount || 0), 0);
  const totalRevised = data.reduce((s, r) => s + (r.revised_amount || 0), 0);
  const totalCommitted = data.reduce((s, r) => s + (r.committed_amount || 0), 0);
  const totalVariance = data.reduce((s, r) => s + (r.variance || 0), 0);

  return (
    <div>
      <PageHeader title="Budgets" count={data.length} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Original Budget" value={formatCurrency(totalOriginal)} />
        <StatCard label="Revised Budget" value={formatCurrency(totalRevised)} />
        <StatCard label="Committed" value={formatCurrency(totalCommitted)} />
        <StatCard label="Variance" value={formatCurrency(totalVariance)} />
      </div>

      <DataTable
        data={data}
        columns={[
          {
            key: "project",
            header: "Project",
            render: (r) => (
              <Link href={`/projects/${r.project_id}`} className="text-brand-orange hover:underline">
                {(r as any).projects?.name || r.project_id}
              </Link>
            ),
          },
          { key: "code", header: "Code" },
          { key: "description", header: "Description" },
          { key: "original_amount", header: "Original", render: (r) => formatCurrency(r.original_amount), className: "text-right" },
          { key: "revised_amount", header: "Revised", render: (r) => formatCurrency(r.revised_amount), className: "text-right" },
          { key: "committed_amount", header: "Committed", render: (r) => formatCurrency(r.committed_amount), className: "text-right" },
          {
            key: "variance",
            header: "Variance",
            render: (r) => (
              <span className={r.variance < 0 ? "text-red-600" : "text-green-600"}>
                {formatCurrency(r.variance)}
              </span>
            ),
            className: "text-right",
          },
        ]}
      />
    </div>
  );
}
