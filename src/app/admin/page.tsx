"use client";

import Link from "next/link";

const adminSections = [
  { title: "Company Settings", description: "Configure company-wide settings, branding, and preferences.", href: "/system", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
  { title: "User Management", description: "Manage users, roles, and access permissions.", href: "/permissions", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" },
  { title: "Workflows", description: "Configure approval workflows for change orders, invoices, and more.", href: "/workflows", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z" },
  { title: "Cost Catalog", description: "Manage centralized cost codes and standard cost structures.", href: "/cost-catalog", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { title: "ERP Integrations", description: "Configure integrations with accounting and ERP systems.", href: "/erp", icon: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" },
  { title: "Training", description: "Manage training programs, certifications, and compliance.", href: "/training", icon: "M22 10L12 5 2 10l10 5 10-5z" },
];

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Admin</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">Company-wide administration and configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-brand-orange/30 transition-all"
          >
            <div className="p-3 bg-brand-navy/5 rounded-lg text-brand-navy w-fit mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={s.icon} />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-brand-navy mb-2">{s.title}</h3>
            <p className="text-sm text-gray-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
