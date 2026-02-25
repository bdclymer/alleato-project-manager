"use client";

import { useState } from "react";

interface Integration {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "disconnected" | "syncing";
  lastSync?: string;
}

const initialIntegrations: Integration[] = [
  {
    name: "QuickBooks",
    description:
      "Sync invoices, payments, and general ledger entries with QuickBooks Online.",
    status: "disconnected",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M8 12l3-3M8 12l3 3M16 12l-3-3M16 12l-3 3" />
      </svg>
    ),
  },
  {
    name: "Sage 300",
    description:
      "Connect with Sage 300 CRE for job costing, accounts payable, and payroll integration.",
    status: "disconnected",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M8 7v10M12 7v10M16 7v10M2 12h20" />
      </svg>
    ),
  },
  {
    name: "Viewpoint Vista",
    description:
      "Integrate with Viewpoint Vista for financial management, project management, and HR.",
    status: "disconnected",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 20l10-16 10 16H2z" />
        <path d="M12 14v2M12 18h.01" />
      </svg>
    ),
  },
  {
    name: "Procore",
    description:
      "Two-way sync with Procore for project data, RFIs, submittals, and daily logs.",
    status: "syncing",
    lastSync: "2 minutes ago",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 4v6h-6M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
  },
  {
    name: "Job Planner",
    description:
      "Sync schedules, resources, and task assignments with Job Planner platform.",
    status: "connected",
    lastSync: "15 minutes ago",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
      </svg>
    ),
  },
];

const statusConfig = {
  connected: {
    label: "Connected",
    dotColor: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
  disconnected: {
    label: "Disconnected",
    dotColor: "bg-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-500",
  },
  syncing: {
    label: "Syncing",
    dotColor: "bg-brand-orange",
    bgColor: "bg-orange-50",
    textColor: "text-brand-orange",
  },
};

export default function ErpPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations);

  const handleAction = (index: number) => {
    setIntegrations((prev) => {
      const updated = [...prev];
      const current = updated[index];

      if (current.status === "disconnected") {
        // Simulate connecting
        updated[index] = { ...current, status: "syncing" };
        setTimeout(() => {
          setIntegrations((p) => {
            const u = [...p];
            u[index] = {
              ...u[index],
              status: "connected",
              lastSync: "Just now",
            };
            return u;
          });
        }, 2500);
      } else if (current.status === "connected") {
        // Simulate syncing
        updated[index] = { ...current, status: "syncing" };
        setTimeout(() => {
          setIntegrations((p) => {
            const u = [...p];
            u[index] = {
              ...u[index],
              status: "connected",
              lastSync: "Just now",
            };
            return u;
          });
        }, 2000);
      }
      // If syncing, do nothing

      return updated;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">
          ERP Integrations
        </h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Connect your enterprise systems to synchronize financial data, project
          information, and resources.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {integrations.filter((i) => i.status === "connected").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Connected</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-brand-orange">
            {integrations.filter((i) => i.status === "syncing").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Syncing</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">
            {integrations.filter((i) => i.status === "disconnected").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Disconnected</p>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrations.map((integration, index) => {
          const status = statusConfig[integration.status];

          return (
            <div
              key={integration.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6 hover:shadow-md transition-shadow"
            >
              {/* Icon */}
              <div className="p-3 bg-brand-navy/5 rounded-lg text-brand-navy flex-shrink-0">
                {integration.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-brand-navy">
                    {integration.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${status.dotColor} ${
                        integration.status === "syncing" ? "animate-pulse" : ""
                      }`}
                    />
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{integration.description}</p>
                {integration.lastSync && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last synced: {integration.lastSync}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {integration.status === "disconnected" && (
                  <button
                    onClick={() => handleAction(index)}
                    className="px-5 py-2.5 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors"
                  >
                    Connect
                  </button>
                )}
                {integration.status === "connected" && (
                  <button
                    onClick={() => handleAction(index)}
                    className="px-5 py-2.5 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-colors"
                  >
                    Sync Now
                  </button>
                )}
                {integration.status === "syncing" && (
                  <button
                    disabled
                    className="px-5 py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed flex items-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
