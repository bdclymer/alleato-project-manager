"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { DrawingLog } from "@/components/drawings/DrawingLog";
import { DrawingSets } from "@/components/drawings/DrawingSets";
import { DrawingUpload } from "@/components/drawings/DrawingUpload";
import { DrawingViewer } from "@/components/drawings/DrawingViewer";
import { TransmittalManager } from "@/components/drawings/TransmittalManager";

type Tab = "log" | "sets" | "upload" | "transmittals";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "log", label: "Drawing Log", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "sets", label: "Drawing Sets", icon: "M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" },
  { id: "upload", label: "Upload", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  { id: "transmittals", label: "Transmittals", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" },
];

export default function DrawingsPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("log");
  const [viewingDrawingId, setViewingDrawingId] = useState<string | null>(null);

  // Full-screen drawing viewer overlay
  if (viewingDrawingId) {
    return (
      <DrawingViewer
        drawingId={viewingDrawingId}
        projectId={id}
        onClose={() => setViewingDrawingId(null)}
      />
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Drawings</h1>
          <div className="w-12 h-1 bg-brand-orange rounded mt-1" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "log" && (
        <DrawingLog
          projectId={id}
          onViewDrawing={(drawingId) => setViewingDrawingId(drawingId)}
        />
      )}

      {activeTab === "sets" && (
        <DrawingSets projectId={id} />
      )}

      {activeTab === "upload" && (
        <DrawingUpload
          projectId={id}
          onComplete={() => setActiveTab("log")}
          onCancel={() => setActiveTab("log")}
        />
      )}

      {activeTab === "transmittals" && (
        <TransmittalManager projectId={id} />
      )}
    </div>
  );
}
