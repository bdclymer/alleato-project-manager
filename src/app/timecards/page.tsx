"use client";

import { CrudPage } from "@/components/CrudPage";
import { timecardsModule } from "@/lib/modules";

export default function TimecardsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Timecards</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Labor time tracking with cost code assignment and clock-in/clock-out.
        </p>
      </div>
      <CrudPage
        config={{ ...timecardsModule, projectScoped: false }}
        showHeader={false}
      />
    </div>
  );
}
