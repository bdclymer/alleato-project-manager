"use client";

import { useEffect, useState, useCallback } from "react";
import { ModuleConfig } from "@/lib/modules";
import { listRecords, createRecord, updateRecord, deleteRecord } from "@/lib/crud";
import { formatDate, formatCurrency, statusColor, cn } from "@/lib/utils";
import { Modal } from "./Modal";
import { FormField } from "./FormField";
import { StatusBadge } from "./StatusBadge";

interface CrudPageProps {
  config: ModuleConfig;
  projectId?: string;
  showHeader?: boolean;
}

export function CrudPage({ config, projectId, showHeader = true }: CrudPageProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listRecords(config.table, {
        projectId: config.projectScoped ? projectId : undefined,
        orderBy: config.defaultSort?.column || "created_at",
        ascending: config.defaultSort?.ascending ?? false,
      });
      setRecords(data);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [config, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditRecord(null);
    const defaults: Record<string, any> = {};
    config.formFields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
    });
    if (config.projectScoped && projectId) defaults.project_id = projectId;
    setFormData(defaults);
    setModalOpen(true);
  };

  const openEdit = (record: any) => {
    setEditRecord(record);
    const data: Record<string, any> = {};
    config.formFields.forEach((f) => {
      data[f.key] = record[f.key] ?? "";
    });
    setFormData(data);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editRecord) {
        await updateRecord(config.table, editRecord.id, formData);
      } else {
        await createRecord(config.table, formData);
      }
      setModalOpen(false);
      await loadData();
    } catch (e: any) {
      alert("Error saving: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord(config.table, id);
      setDeleteConfirm(null);
      await loadData();
    } catch (e: any) {
      alert("Error deleting: " + (e.message || "Unknown error"));
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = config.searchField
    ? records.filter((r) => {
        const val = r[config.searchField!];
        return !search || (val && String(val).toLowerCase().includes(search.toLowerCase()));
      })
    : records;

  const renderCell = (record: any, col: any) => {
    const val = record[col.key];
    if (col.render) return col.render(record);
    if (col.type === "date") return formatDate(val);
    if (col.type === "currency") return formatCurrency(val);
    if (col.type === "status") return <StatusBadge status={val} />;
    if (col.type === "badge") {
      return val ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
          {String(val).replace(/_/g, " ")}
        </span>
      ) : "—";
    }
    if (typeof val === "boolean") return val ? "Yes" : "No";
    return val ?? "—";
  };

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{config.plural}</h1>
            <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New {config.singular}
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search + count */}
      <div className="flex items-center justify-between mb-4">
        {config.searchField && (
          <input
            type="text"
            placeholder={`Search ${config.plural.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          />
        )}
        <p className="text-xs text-gray-400 ml-auto">
          {filtered.length} of {records.length} records
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {config.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No {config.plural.toLowerCase()} found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      onClick={() => openEdit(record)}
                    >
                      {config.columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm">
                          {renderCell(record, col)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(record.id);
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRecord ? `Edit ${config.singular}` : `New ${config.singular}`}
        wide
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {config.formFields.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={updateField}
              />
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editRecord ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={`Delete ${config.singular}`}
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete this {config.singular.toLowerCase()}? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
