"use client";

import { useState } from "react";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const reports: ReportCard[] = [
  {
    title: "Financial Summary",
    description:
      "Consolidated financial overview across all projects including revenue, costs, and profit margins.",
    category: "Financial",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "Schedule Status",
    description:
      "Timeline analysis showing milestone completion, critical path items, and schedule variance by project.",
    category: "Schedule",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
      </svg>
    ),
  },
  {
    title: "Safety Dashboard",
    description:
      "Comprehensive safety metrics including incident rates, inspection results, and observation trends.",
    category: "Safety",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "RFI Status",
    description:
      "Summary of all Requests for Information across projects with aging analysis and response metrics.",
    category: "Project Controls",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
  {
    title: "Submittal Log",
    description:
      "Detailed log of all submittals with approval status, review timelines, and outstanding items.",
    category: "Project Controls",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    title: "Budget vs Actual",
    description:
      "Comparative analysis of budgeted costs versus actual expenditures with variance reporting.",
    category: "Financial",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export default function ReportsPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (title: string) => {
    setGenerating(title);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(null);
    }, 2000);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Reports</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">
          Generate and view reports across all your projects and company data.
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow"
          >
            {/* Icon + Category */}
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-brand-navy/5 rounded-lg text-brand-navy">
                {report.icon}
              </div>
              <span className="text-xs font-medium text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-full">
                {report.category}
              </span>
            </div>

            {/* Title + Description */}
            <h3 className="text-lg font-semibold text-brand-navy mb-2">
              {report.title}
            </h3>
            <p className="text-sm text-gray-500 flex-1 mb-6">
              {report.description}
            </p>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerate(report.title)}
              disabled={generating === report.title}
              className="w-full px-4 py-2.5 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating === report.title ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
