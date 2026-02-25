"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Company-level navigation — full Procore parity
const COMPANY_NAV = [
  { section: "Portfolio" },
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/portfolio", label: "Portfolio", icon: "bar-chart" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/analytics", label: "Analytics", icon: "bar-chart" },
  { section: "Project Tools" },
  { href: "/rfis", label: "RFIs", icon: "help-circle" },
  { href: "/submittals", label: "Submittals", icon: "file-check" },
  { href: "/budgets", label: "Budgets", icon: "dollar-sign" },
  { href: "/change-orders", label: "Change Orders", icon: "refresh-cw" },
  { href: "/meeting-minutes", label: "Meeting Minutes", icon: "calendar" },
  { section: "Preconstruction" },
  { href: "/bids", label: "Bid Management", icon: "gavel" },
  { href: "/prequalification", label: "Prequalification", icon: "shield-check" },
  { href: "/planroom", label: "Planroom", icon: "folder" },
  { href: "/cost-catalog", label: "Cost Catalog", icon: "dollar-sign" },
  { section: "Company Tools" },
  { href: "/directory", label: "Directory", icon: "users" },
  { href: "/company-documents", label: "Documents", icon: "folder" },
  { href: "/conversations", label: "Conversations", icon: "mail" },
  { href: "/training", label: "Training", icon: "graduation-cap" },
  { href: "/reports", label: "Reports", icon: "bar-chart" },
  { href: "/erp", label: "ERP Integrations", icon: "link" },
  { section: "Financial" },
  { href: "/payments", label: "Payments", icon: "credit-card" },
  { href: "/workflows", label: "Workflows", icon: "settings" },
  { section: "Resource Management" },
  { href: "/resource-planning", label: "Resource Planning", icon: "users" },
  { href: "/company-schedule", label: "Schedule", icon: "gantt-chart" },
  { href: "/timecards", label: "Timecards", icon: "clock" },
  { href: "/timesheets", label: "Timesheets", icon: "clock" },
  { section: "Quality & Safety" },
  { href: "/correspondence", label: "Correspondence", icon: "mail" },
  { href: "/incidents", label: "Incidents", icon: "alert-circle" },
  { href: "/inspections", label: "Inspections", icon: "clipboard-check" },
  { href: "/observations", label: "Observations", icon: "eye" },
  { href: "/action-plans", label: "Action Plans", icon: "target" },
  { section: "Admin" },
  { href: "/admin", label: "Admin", icon: "settings" },
  { href: "/permissions", label: "Permissions", icon: "shield-check" },
  { href: "/system", label: "System", icon: "settings" },
] as const;

// SVG icon paths
const ICONS: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  folder: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
  "help-circle": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  "file-check": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z",
  "dollar-sign": "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  "refresh-cw": "M23 4v6h-6M1 20v-6h6",
  calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  gavel: "M14 10L8 16M12 2L2 12l4 4L16 6zM20 20l-6-6",
  "shield-check": "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "graduation-cap": "M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1 3 3 6 3s6-2 6-3v-5",
  "bar-chart": "M18 20V10M12 20V4M6 20v-6",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  "alert-circle": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
  "clipboard-check": "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 14l2 2 4-4",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  target: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 18a6 6 0 100-12 6 6 0 000 12zM12 14a2 2 0 100-4 2 2 0 000 4z",
  // Project-level icons
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  "check-square": "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z",
  "file-text": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  blueprint: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM8 10h8M8 14h4",
  "book-open": "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  "gantt-chart": "M3 3v18h18M7 14h4M7 10h8M7 6h6",
  handshake: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
  "alert-triangle": "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  receipt: "M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z",
  "credit-card": "M1 10h22M1 4h22v16H1z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  inbox: "M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  "user-plus": "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z",
  chevronDown: "M6 9l6 6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
};

function NavIcon({ name }: { name: string }) {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name] || ICONS.grid} />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-brand-navy text-white flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-navy-light">
        <Link href="/" className="block">
          <h1 className="text-lg font-bold">
            <span className="text-brand-orange">Alleato</span> Group
          </h1>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-widest">
            Project Manager
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 text-[13px] scrollbar-thin">
        {COMPANY_NAV.map((item, i) => {
          if ("section" in item) {
            return (
              <div key={i} className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {item.section}
                </span>
              </div>
            );
          }

          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors",
                active
                  ? "bg-brand-orange text-white"
                  : "text-gray-300 hover:bg-brand-navy-light hover:text-white"
              )}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-brand-navy-light text-[10px] text-gray-500">
        Powered by Alleato Group
      </div>
    </aside>
  );
}
