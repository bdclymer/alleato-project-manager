"use client";

import { useState } from "react";

const roles = [
  { name: "Admin", description: "Full access to all company and project tools.", users: 2, color: "bg-red-100 text-red-700" },
  { name: "Project Manager", description: "Full access to assigned projects and read-only company tools.", users: 5, color: "bg-blue-100 text-blue-700" },
  { name: "Superintendent", description: "Field tools, daily logs, inspections, and punch list access.", users: 8, color: "bg-green-100 text-green-700" },
  { name: "Foreman", description: "Timesheets, daily logs, and crew management.", users: 12, color: "bg-amber-100 text-amber-700" },
  { name: "Subcontractor", description: "View assigned items, submit invoices and timesheets.", users: 20, color: "bg-purple-100 text-purple-700" },
  { name: "Read Only", description: "View-only access to all project data.", users: 15, color: "bg-gray-100 text-gray-700" },
];

const modules = [
  "RFIs", "Submittals", "Budget", "Schedule", "Daily Logs", "Punch List",
  "Inspections", "Incidents", "Documents", "Photos", "Timesheets",
  "Change Orders", "Invoices", "Drawings", "Correspondence",
];

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState("Admin");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Permissions</h1>
        <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        <p className="text-sm text-gray-500 mt-3">Role-based access control and permission templates.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {roles.map((role) => (
          <button
            key={role.name}
            onClick={() => setSelectedRole(role.name)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedRole === role.name
                ? "border-brand-orange shadow-md"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${role.color}`}>
              {role.name}
            </span>
            <p className="text-xs text-gray-400 mt-2">{role.users} users</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-brand-navy">
            {selectedRole} Permissions
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {roles.find((r) => r.name === selectedRole)?.description}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Module</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">None</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Read</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Standard</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {modules.map((mod) => (
                <tr key={mod} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-medium">{mod}</td>
                  {["none", "read", "standard", "admin"].map((level) => (
                    <td key={level} className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name={`perm-${mod}`}
                        defaultChecked={selectedRole === "Admin" ? level === "admin" : selectedRole === "Read Only" ? level === "read" : level === "standard"}
                        className="accent-brand-orange"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
