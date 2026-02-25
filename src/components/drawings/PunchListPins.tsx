"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Pin {
  id: string;
  pin_type: string;
  linked_id?: string;
  x_percent: number;
  y_percent: number;
  label?: string;
  status?: string;
  color?: string;
  notes?: string;
  created_by?: string;
}

interface PinOverlayProps {
  pins: Pin[];
  imgSize: { width: number; height: number };
  filter: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Pin>) => void;
}

const PIN_COLORS: Record<string, Record<string, string>> = {
  punch_list: { open: "#EF4444", in_progress: "#EAB308", closed: "#22C55E" },
  inspection: { open: "#3B82F6", in_progress: "#8B5CF6", passed: "#22C55E", failed: "#EF4444" },
  rfi: { open: "#F97316", answered: "#22C55E", closed: "#6B7280" },
  submittal: { open: "#3B82F6", approved: "#22C55E", rejected: "#EF4444" },
  observation: { open: "#EAB308", resolved: "#22C55E" },
  incident: { open: "#EF4444", investigating: "#F97316", closed: "#6B7280" },
};

const PIN_ICONS: Record<string, string> = {
  punch_list: "!",
  inspection: "I",
  rfi: "?",
  submittal: "S",
  observation: "O",
  incident: "X",
};

export function PunchListPinOverlay({ pins, imgSize, filter, onDelete, onUpdate }: PinOverlayProps) {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);

  const filteredPins = filter === "all" ? pins : pins.filter((p) => p.pin_type === filter);

  const getPinColor = (pin: Pin) => {
    const typeColors = PIN_COLORS[pin.pin_type] || {};
    return typeColors[pin.status || "open"] || pin.color || "#6B7280";
  };

  return (
    <>
      {filteredPins.map((pin) => {
        const x = (pin.x_percent / 100) * imgSize.width;
        const y = (pin.y_percent / 100) * imgSize.height;
        const color = getPinColor(pin);
        const isSelected = selectedPin === pin.id;
        const icon = PIN_ICONS[pin.pin_type] || "#";

        return (
          <div
            key={pin.id}
            className="absolute"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -100%)",
              zIndex: isSelected ? 20 : 10,
            }}
          >
            {/* Pin marker */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin(isSelected ? null : pin.id);
              }}
              className="relative group"
            >
              {/* Pin shape */}
              <svg width="28" height="36" viewBox="0 0 28 36" className="drop-shadow-lg">
                <path
                  d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z"
                  fill={color}
                />
                <circle cx="14" cy="13" r="8" fill="white" fillOpacity="0.9" />
                <text x="14" y="17" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  {icon}
                </text>
              </svg>
              {/* Label on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {pin.label || pin.pin_type.replace("_", " ")}
                  <span className="ml-1 opacity-60">({pin.status || "open"})</span>
                </div>
              </div>
            </button>

            {/* Detail popup */}
            {isSelected && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-72 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: color + "20", color }}>
                      {pin.pin_type.replace("_", " ").toUpperCase()}
                    </span>
                    <button onClick={() => setSelectedPin(null)} className="text-gray-300 hover:text-gray-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-brand-navy">{pin.label || "Untitled"}</h4>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1">Status</label>
                    <select
                      value={pin.status || "open"}
                      onChange={(e) => onUpdate(pin.id, { status: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1">Label</label>
                    <input
                      type="text"
                      defaultValue={pin.label || ""}
                      onBlur={(e) => onUpdate(pin.id, { label: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-1">Notes</label>
                    <textarea
                      defaultValue={pin.notes || ""}
                      onBlur={(e) => onUpdate(pin.id, { notes: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-gray-400">
                      Position: {pin.x_percent.toFixed(1)}%, {pin.y_percent.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => { onDelete(pin.id); setSelectedPin(null); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete Pin
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
