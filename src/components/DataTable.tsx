"use client";

import { useState } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchField?: keyof T;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchField,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filtered = searchField
    ? data.filter((row) => {
        const val = row[searchField];
        return val && String(val).toLowerCase().includes(search.toLowerCase());
      })
    : data;

  return (
    <div>
      {searchField && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id || i} className="hover:bg-gray-50/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ""}`}>
                        {col.render ? col.render(row) : row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Showing {filtered.length} of {data.length} records
      </p>
    </div>
  );
}
