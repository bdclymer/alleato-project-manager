"use client";

import { CrudPage } from "@/components/CrudPage";
import { companyScheduleModule } from "@/lib/modules";

export default function CompanySchedulePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Company Schedule</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Master schedule across all projects with cross-project timeline management.
        </p>
      </div>
      <CrudPage
        config={{ ...companyScheduleModule, projectScoped: false }}
        showHeader={false}
      />
    </div>
  );
}
