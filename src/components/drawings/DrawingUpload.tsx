"use client";

import { useState, useRef, useCallback } from "react";
import { uploadDrawingFile } from "@/lib/drawing-storage";
import { createDrawing, createRevision, listDrawingSets } from "@/lib/drawings";
import { formatFileSize, isDrawingFile, getFileExtension } from "@/lib/drawing-storage";

interface UploadFile {
  file: File;
  name: string;
  drawingNumber: string;
  title: string;
  discipline: string;
  setId: string;
  revision: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface DrawingUploadProps {
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const DISCIPLINES = [
  { value: "architectural", label: "Architectural" },
  { value: "structural", label: "Structural" },
  { value: "mechanical", label: "Mechanical" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "civil", label: "Civil" },
  { value: "landscape", label: "Landscape" },
  { value: "fire_protection", label: "Fire Protection" },
];

export function DrawingUpload({ projectId, onComplete, onCancel }: DrawingUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [bulkDiscipline, setBulkDiscipline] = useState("");
  const [bulkSetId, setBulkSetId] = useState("");
  const [bulkRevision, setBulkRevision] = useState("Rev A");
  const [autoNumber, setAutoNumber] = useState(true);
  const [numberPrefix, setNumberPrefix] = useState("A-");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSets = useCallback(async () => {
    try {
      const data = await listDrawingSets(projectId);
      setSets(data);
    } catch { /* ignore */ }
  }, [projectId]);

  useState(() => { loadSets(); });

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => isDrawingFile(f.name));
    const startIdx = files.length;
    const mapped: UploadFile[] = arr.map((file, i) => {
      const ext = getFileExtension(file.name);
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      return {
        file,
        name: file.name,
        drawingNumber: autoNumber ? `${numberPrefix}${String(startIdx + i + 1).padStart(3, "0")}` : "",
        title: baseName,
        discipline: bulkDiscipline,
        setId: bulkSetId,
        revision: bulkRevision,
        status: "pending",
        progress: 0,
      };
    });
    setFiles((prev) => [...prev, ...mapped]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const applyBulkSettings = () => {
    setFiles((prev) =>
      prev.map((f, i) => ({
        ...f,
        discipline: bulkDiscipline || f.discipline,
        setId: bulkSetId || f.setId,
        revision: bulkRevision || f.revision,
        drawingNumber: autoNumber
          ? `${numberPrefix}${String(i + 1).padStart(3, "0")}`
          : f.drawingNumber,
      }))
    );
  };

  const handleUpload = async () => {
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === "done") continue;
      updateFile(i, { status: "uploading", progress: 10 });
      try {
        const setName = sets.find((s) => s.id === f.setId)?.name || "general";
        updateFile(i, { progress: 30 });
        const uploaded = await uploadDrawingFile(f.file, projectId, setName, f.revision);
        updateFile(i, { progress: 60 });

        const drawing = await createDrawing({
          project_id: projectId,
          drawing_number: f.drawingNumber,
          title: f.title,
          discipline: f.discipline || null,
          drawing_set_id: f.setId || null,
          revision: f.revision,
          revision_date: new Date().toISOString(),
          status: "current",
          file_url: uploaded.url,
          file_name: f.file.name,
          file_size: f.file.size,
          page_number: i + 1,
        });
        updateFile(i, { progress: 80 });

        await createRevision({
          drawing_id: drawing.id,
          project_id: projectId,
          revision_number: f.revision,
          file_url: uploaded.url,
          file_name: f.file.name,
          file_size: f.file.size,
          storage_path: uploaded.path,
          description: "Initial upload",
        });

        updateFile(i, { status: "done", progress: 100 });
      } catch (err: any) {
        updateFile(i, { status: "error", error: err.message || "Upload failed" });
      }
    }
    setUploading(false);
    const allDone = files.every((f) => f.status === "done");
    if (allDone) onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Bulk settings */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-brand-navy mb-3">Bulk Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
            <select
              value={bulkDiscipline}
              onChange={(e) => setBulkDiscipline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select...</option>
              {DISCIPLINES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Drawing Set</label>
            <select
              value={bulkSetId}
              onChange={(e) => setBulkSetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">None</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Revision</label>
            <input
              type="text"
              value={bulkRevision}
              onChange={(e) => setBulkRevision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Rev A"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Auto-Number Prefix</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoNumber}
                onChange={(e) => setAutoNumber(e.target.checked)}
                className="w-4 h-4 text-brand-orange rounded"
              />
              <input
                type="text"
                value={numberPrefix}
                onChange={(e) => setNumberPrefix(e.target.value)}
                disabled={!autoNumber}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                placeholder="A-"
              />
            </div>
          </div>
        </div>
        <button
          onClick={applyBulkSettings}
          className="mt-3 px-3 py-1.5 bg-brand-navy text-white text-xs font-medium rounded-lg hover:bg-brand-navy-light"
        >
          Apply to All Files
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver ? "border-brand-orange bg-brand-orange/5" : "border-gray-300 hover:border-brand-orange/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.gif,.webp,.svg"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p className="text-sm text-gray-600 font-medium">
          Drop drawing files here or <span className="text-brand-orange">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports PDF, DWG, DXF, PNG, JPG (max 500MB each)
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-navy">
              {files.length} file{files.length !== 1 ? "s" : ""} queued
            </span>
            <span className="text-xs text-gray-400">
              {formatFileSize(files.reduce((s, f) => s + f.file.size, 0))} total
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {getFileExtension(f.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={f.drawingNumber}
                    onChange={(e) => updateFile(i, { drawingNumber: e.target.value })}
                    className="px-2 py-1 border border-gray-200 rounded text-xs"
                    placeholder="Number"
                    disabled={uploading}
                  />
                  <input
                    type="text"
                    value={f.title}
                    onChange={(e) => updateFile(i, { title: e.target.value })}
                    className="px-2 py-1 border border-gray-200 rounded text-xs col-span-2"
                    placeholder="Title"
                    disabled={uploading}
                  />
                  <input
                    type="text"
                    value={f.revision}
                    onChange={(e) => updateFile(i, { revision: e.target.value })}
                    className="px-2 py-1 border border-gray-200 rounded text-xs"
                    placeholder="Revision"
                    disabled={uploading}
                  />
                </div>
                <div className="w-16 text-right text-xs text-gray-400">
                  {formatFileSize(f.file.size)}
                </div>
                {f.status === "done" && (
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                {f.status === "uploading" && (
                  <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                )}
                {f.status === "error" && (
                  <span className="text-xs text-red-500" title={f.error}>Error</span>
                )}
                {f.status === "pending" && (
                  <button
                    onClick={() => removeFile(i)}
                    className="text-gray-300 hover:text-red-500"
                    disabled={uploading}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="px-6 py-2 bg-brand-orange text-white text-sm font-medium rounded-lg hover:bg-brand-orange-dark disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Upload {files.length} File{files.length !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
