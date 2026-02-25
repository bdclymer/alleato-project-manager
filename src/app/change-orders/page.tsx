"use client";

import { useState } from "react";
import { CrudPage } from "@/components/CrudPage";
import { commitmentCOsModule, contractCOsModule } from "@/lib/modules";

export default function ChangeOrdersPage() {
  const [tab, setTab] = useState<"commitment" | "contract">("commitment");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Change Orders</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
      </div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("commitment")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "commitment"
              ? "bg-brand-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Commitment COs
        </button>
        <button
          onClick={() => setTab("contract")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === "contract"
              ? "bg-brand-orange text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Prime Contract COs
        </button>
      </div>
      {tab === "commitment" ? (
        <CrudPage config={{ ...commitmentCOsModule, projectScoped: false }} showHeader={false} />
      ) : (
        <CrudPage config={{ ...contractCOsModule, projectScoped: false }} showHeader={false} />
      )}
    </div>
  );
}
