"use client";

import { CrudPage } from "@/components/CrudPage";
import { companyDocumentsModule } from "@/lib/modules";

export default function PlanroomPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Planroom</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Centralized plan hosting and distribution for trade partners and bidders.
        </p>
      </div>
      <CrudPage
        config={{
          ...companyDocumentsModule,
          table: "company_documents",
          singular: "Plan Document",
          plural: "Plan Documents",
          projectScoped: false,
        }}
        showHeader={false}
      />
    </div>
  );
}
