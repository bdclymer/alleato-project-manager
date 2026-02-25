"use client";

import { cn } from "@/lib/utils";

export type MarkupTool =
  | "select" | "pen" | "line" | "arrow" | "rectangle" | "circle"
  | "cloud" | "text" | "callout" | "stamp" | "dimension" | "hyperlink";

export const STAMP_TYPES = [
  { value: "approved", label: "APPROVED", bgColor: "#DCFCE7", borderColor: "#16A34A" },
  { value: "rejected", label: "REJECTED", bgColor: "#FEE2E2", borderColor: "#DC2626" },
  { value: "for_construction", label: "FOR CONSTRUCTION", bgColor: "#DBEAFE", borderColor: "#2563EB" },
  { value: "preliminary", label: "PRELIMINARY", bgColor: "#FEF3C7", borderColor: "#D97706" },
  { value: "void", label: "VOID", bgColor: "#F3F4F6", borderColor: "#6B7280" },
  { value: "revised", label: "REVISED", bgColor: "#EDE9FE", borderColor: "#7C3AED" },
];

const COLORS = [
  "#FF0000", "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#000000", "#6B7280",
];

interface ToolDef {
  id: MarkupTool;
  label: string;
  icon: string;
  group: string;
}

const TOOLS: ToolDef[] = [
  { id: "select", label: "Select / Pan", icon: "M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z", group: "Navigate" },
  { id: "pen", label: "Freehand Pen", icon: "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z", group: "Draw" },
  { id: "line", label: "Line", icon: "M5 12h14", group: "Draw" },
  { id: "arrow", label: "Arrow", icon: "M5 12h14M12 5l7 7-7 7", group: "Draw" },
  { id: "rectangle", label: "Rectangle", icon: "M3 3h18v18H3z", group: "Shapes" },
  { id: "circle", label: "Circle / Ellipse", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", group: "Shapes" },
  { id: "cloud", label: "Cloud", icon: "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z", group: "Shapes" },
  { id: "text", label: "Text", icon: "M4 7V4h16v3M9 20h6M12 4v16", group: "Text" },
  { id: "callout", label: "Callout Box", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", group: "Text" },
  { id: "stamp", label: "Stamp", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", group: "Stamps" },
  { id: "dimension", label: "Dimension / Measure", icon: "M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.4 2.4 0 010-3.4l2.6-2.6a2.4 2.4 0 013.4 0zM14 4l6 6", group: "Measure" },
  { id: "hyperlink", label: "Hyperlink", icon: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71", group: "Links" },
];

interface MarkupToolbarProps {
  activeTool: MarkupTool;
  activeColor: string;
  strokeWidth: number;
  fontSize: number;
  onToolChange: (tool: MarkupTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onFontSizeChange: (size: number) => void;
  onStampSelect: (stampType: string) => void;
  onDeleteSelected: () => void;
}

export function MarkupToolbar({
  activeTool,
  activeColor,
  strokeWidth,
  fontSize,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onFontSizeChange,
  onStampSelect,
  onDeleteSelected,
}: MarkupToolbarProps) {
  let lastGroup = "";

  return (
    <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-2 shrink-0 overflow-y-auto">
      {/* Tools */}
      {TOOLS.map((tool) => {
        const showDivider = tool.group !== lastGroup && lastGroup !== "";
        lastGroup = tool.group;
        return (
          <div key={tool.id}>
            {showDivider && <div className="w-8 h-px bg-gray-600 my-1.5" />}
            <button
              onClick={() => onToolChange(tool.id)}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-colors mb-0.5",
                activeTool === tool.id
                  ? "bg-brand-orange text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              )}
              title={tool.label}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tool.icon} />
              </svg>
            </button>
          </div>
        );
      })}

      <div className="w-8 h-px bg-gray-600 my-2" />

      {/* Color picker */}
      <div className="space-y-1 px-1">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-5 h-5 rounded-full border-2 transition-transform",
              activeColor === color ? "border-white scale-125" : "border-transparent hover:scale-110"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <div className="w-8 h-px bg-gray-600 my-2" />

      {/* Stroke width */}
      <div className="px-1 space-y-1">
        {[1, 2, 3, 5].map((w) => (
          <button
            key={w}
            onClick={() => onStrokeWidthChange(w)}
            className={cn(
              "w-10 h-6 flex items-center justify-center rounded",
              strokeWidth === w ? "bg-gray-600" : "hover:bg-gray-700"
            )}
            title={`${w}px`}
          >
            <div
              className="rounded-full"
              style={{ width: 16, height: w, backgroundColor: activeColor }}
            />
          </button>
        ))}
      </div>

      {/* Stamp submenu */}
      {activeTool === "stamp" && (
        <>
          <div className="w-8 h-px bg-gray-600 my-2" />
          <div className="px-0.5 space-y-0.5">
            {STAMP_TYPES.map((stamp) => (
              <button
                key={stamp.value}
                onClick={() => onStampSelect(stamp.value)}
                className="w-[52px] py-1 text-[7px] font-bold rounded border text-center leading-tight"
                style={{
                  backgroundColor: stamp.bgColor,
                  borderColor: stamp.borderColor,
                  color: stamp.borderColor,
                }}
              >
                {stamp.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
