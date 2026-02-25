"use client";

import { CrudPage } from "@/components/CrudPage";
import { crewsModule } from "@/lib/modules";

export default function ResourcePlanningPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Resource Planning</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Labor, equipment, and material resource allocation across projects.
        </p>
      </div>
      <CrudPage
        config={{ ...crewsModule, projectScoped: false, plural: "Resources" }}
        showHeader={false}
      />
    </div>
  );
}
