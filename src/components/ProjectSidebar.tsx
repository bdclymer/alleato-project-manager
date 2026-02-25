"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PROJECT_NAV = [
  { section: "Overview" },
  { href: "", label: "Dashboard", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { section: "Project Management" },
  { href: "/rfis", label: "RFIs", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
  { href: "/submittals", label: "Submittals", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" },
  { href: "/drawings", label: "Drawings", icon: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM8 10h8M8 14h4" },
  { href: "/specifications", label: "Specifications", icon: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" },
  { href: "/schedule", label: "Schedule", icon: "M3 3v18h18M7 14h4M7 10h8M7 6h6" },
  { section: "Financial" },
  { href: "/budget", label: "Budget", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { href: "/prime-contracts", label: "Prime Contracts", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { href: "/commitments", label: "Commitments", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" },
  { href: "/change-events", label: "Change Events", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
  { href: "/commitment-cos", label: "Commitment COs", icon: "M23 4v6h-6M1 20v-6h6" },
  { href: "/contract-cos", label: "Prime Contract COs", icon: "M23 4v6h-6M1 20v-6h6" },
  { href: "/owner-invoices", label: "Owner Invoices", icon: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" },
  { href: "/sub-invoices", label: "Sub Invoices", icon: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" },
  { href: "/direct-costs", label: "Direct Costs", icon: "M1 10h22M1 4h22v16H1z" },
  { section: "Field" },
  { href: "/daily-logs", label: "Daily Logs", icon: "M12 17a5 5 0 100-10 5 5 0 000 10z" },
  { href: "/punch-list", label: "Punch List", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { href: "/tasks", label: "Tasks", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { href: "/meetings", label: "Meetings", icon: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" },
  { href: "/forms", label: "Forms", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 14l2 2 4-4" },
  { section: "Quality & Safety" },
  { href: "/inspections", label: "Inspections", icon: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 14l2 2 4-4" },
  { href: "/observations", label: "Observations", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" },
  { href: "/incidents", label: "Incidents", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" },
  { section: "Resources" },
  { href: "/equipment", label: "Equipment", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
  { href: "/materials", label: "Materials", icon: "M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" },
  { href: "/crews", label: "Crews", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  { href: "/timesheets", label: "Timesheets", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2" },
  { section: "Documents & Communication" },
  { href: "/documents", label: "Documents", icon: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" },
  { href: "/photos", label: "Photos", icon: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" },
  { href: "/emails", label: "Emails", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { href: "/correspondence", label: "Correspondence", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" },
  { href: "/transmittals", label: "Transmittals", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" },
  { section: "Field Productivity" },
  { href: "/payments", label: "Payments", icon: "M1 10h22M1 4h22v16H1z" },
  { href: "/funding", label: "Funding", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { href: "/tm-tickets", label: "T&M Tickets", icon: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" },
  { href: "/progress-billings", label: "Progress Billings", icon: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" },
  { href: "/estimating", label: "Estimating", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { href: "/lien-waivers", label: "Lien Waivers", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" },
  { section: "BIM / Design" },
  { href: "/models", label: "Models (BIM)", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { href: "/coordination-issues", label: "Coord. Issues", icon: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" },
  { section: "Preconstruction" },
  { href: "/bidding", label: "Bidding", icon: "M14 10L8 16M12 2L2 12l4 4L16 6zM20 20l-6-6" },
  { href: "/instructions", label: "Instructions", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8" },
  { section: "Other" },
  { href: "/workflows", label: "Workflows", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
  { href: "/action-plans", label: "Action Plans", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
  { href: "/warranties", label: "Warranties", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
  { href: "/directory", label: "Directory", icon: "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" },
  { href: "/reports", label: "Reports", icon: "M18 20V10M12 20V4M6 20v-6" },
];

export function ProjectSidebar({ projectId, projectName }: { projectId: string; projectName: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <aside className="fixed inset-y-0 left-60 w-52 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Project header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <Link
          href="/projects"
          className="text-[11px] text-brand-orange hover:underline flex items-center gap-1 mb-2"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All Projects
        </Link>
        <h2 className="text-sm font-semibold text-brand-navy truncate">{projectName}</h2>
      </div>

      {/* Project navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 text-[12px]">
        {PROJECT_NAV.map((item, i) => {
          if ("section" in item) {
            return (
              <div key={i} className="pt-3 pb-1 px-2">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                  {item.section}
                </span>
              </div>
            );
          }

          const fullHref = basePath + item.href;
          const active = item.href === ""
            ? pathname === basePath || pathname === basePath + "/"
            : pathname.startsWith(fullHref);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md font-medium transition-colors",
                active
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
