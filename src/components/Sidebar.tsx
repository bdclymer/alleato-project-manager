"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/rfis", label: "RFIs", icon: "help-circle" },
  { href: "/submittals", label: "Submittals", icon: "file-check" },
  { href: "/budgets", label: "Budgets", icon: "dollar-sign" },
  { href: "/change-orders", label: "Change Orders", icon: "refresh-cw" },
  { href: "/meeting-minutes", label: "Meeting Minutes", icon: "calendar" },
];

// Simple SVG icons to avoid external dependency issues at build time
function NavIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    folder: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z",
    "help-circle": "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v.01M12 8a2 2 0 00-1.85 1.23",
    "file-check": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-3 14l-3-3 1.41-1.41L11 13.17l4.59-4.58L17 10l-6 6z",
    "dollar-sign": "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    "refresh-cw": "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
    calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
  };
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.grid} />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-navy text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-navy-light">
        <h1 className="text-xl font-bold">
          <span className="text-brand-orange">Alleato</span> Group
        </h1>
        <p className="text-xs text-gray-400 mt-1">Project Manager</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-orange text-white"
                  : "text-gray-300 hover:bg-brand-navy-light hover:text-white"
              )}
            >
              <NavIcon name={icon} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-brand-navy-light text-xs text-gray-500">
        Synced from Job Planner
      </div>
    </aside>
  );
}
