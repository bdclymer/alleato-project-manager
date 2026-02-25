"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getDrawing, listRevisions, listMarkups, createMarkup, deleteMarkup,
  listPins, createPin, updatePin, deletePin, listLayers, createLayer, toggleLayerVisibility,
} from "@/lib/drawings";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/user-context";
import { MarkupToolbar, MarkupTool, STAMP_TYPES } from "./MarkupToolbar";
import { PunchListPinOverlay } from "./PunchListPins";

interface DrawingViewerProps {
  drawingId: string;
  projectId: string;
  onClose: () => void;
}

interface Point { x: number; y: number; }
interface MarkupData {
  id?: string;
  markup_type: string;
  data: any;
  color: string;
  layer: string;
  visible: boolean;
}

const DEFAULT_COLOR = "#FF0000";

export function DrawingViewer({ drawingId, projectId, onClose }: DrawingViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [drawing, setDrawing] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [currentRevision, setCurrentRevision] = useState<string | null>(null);
  const [markups, setMarkups] = useState<any[]>([]);
  const [pins, setPins] = useState<any[]>([]);
  const [layers, setLayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Viewport
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 1200, height: 900 });

  // Tool state
  const [activeTool, setActiveTool] = useState<MarkupTool>("select");
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(14);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [selectedMarkupIds, setSelectedMarkupIds] = useState<Set<string>>(new Set());

  // UI panels
  const [showLayers, setShowLayers] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showPins, setShowPins] = useState(true);
  const [pinFilter, setPinFilter] = useState<string>("all");
  const [addPinMode, setAddPinMode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, revs, m, p, l] = await Promise.all([
        getDrawing(drawingId),
        listRevisions(drawingId).catch(() => []),
        listMarkups(drawingId).catch(() => []),
        listPins(drawingId).catch(() => []),
        listLayers(drawingId).catch(() => []),
      ]);
      setDrawing(d);
      setRevisions(revs);
      setMarkups(m);
      setPins(p);
      setLayers(l);
      if (revs.length > 0) setCurrentRevision(revs[0].id);
    } catch (e) {
      console.error("Failed to load drawing:", e);
    } finally {
      setLoading(false);
    }
  }, [drawingId]);

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showTextInput) { setShowTextInput(false); return; }
        if (activeTool !== "select") { setActiveTool("select"); return; }
        onClose();
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z * 1.2, 10));
      if (e.key === "-") setZoom((z) => Math.max(z / 1.2, 0.1));
      if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedMarkupIds.size > 0) {
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTool, showTextInput, onClose]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 0.1), 10));
  }, []);

  // Convert screen coordinates to SVG coordinates
  const screenToSvg = useCallback((clientX: number, clientY: number): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const svgToPercent = useCallback((p: Point): Point => ({
    x: (p.x / imgSize.width) * 100,
    y: (p.y / imgSize.height) * 100,
  }), [imgSize]);

  // Mouse handlers for drawing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && activeTool === "select" && !addPinMode)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pt = screenToSvg(e.clientX, e.clientY);

    // Pin mode
    if (addPinMode) {
      const pct = svgToPercent(pt);
      handleAddPin(pct, addPinMode);
      setAddPinMode(null);
      return;
    }

    if (activeTool === "pen") {
      setIsDrawing(true);
      setCurrentPoints([pt]);
    } else if (["line", "arrow", "rectangle", "circle", "dimension"].includes(activeTool)) {
      setIsDrawing(true);
      setStartPoint(pt);
      setCurrentPoint(pt);
    } else if (activeTool === "cloud") {
      setIsDrawing(true);
      setCurrentPoints([pt]);
    } else if (["text", "callout"].includes(activeTool)) {
      setTextPosition(pt);
      setShowTextInput(true);
      setTextInput("");
    } else if (activeTool === "stamp") {
      saveMarkup("stamp", {
        x: pt.x, y: pt.y,
        stampType: "approved",
        scale: 1,
      });
    } else if (activeTool === "hyperlink") {
      saveMarkup("hyperlink", {
        x: pt.x, y: pt.y,
        width: 32, height: 32,
        linkType: "drawing",
        linkedId: "",
      });
    }
  }, [activeTool, pan, screenToSvg, svgToPercent, addPinMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!isDrawing) return;
    const pt = screenToSvg(e.clientX, e.clientY);

    if (activeTool === "pen" || activeTool === "cloud") {
      setCurrentPoints((prev) => [...prev, pt]);
    } else if (["line", "arrow", "rectangle", "circle", "dimension"].includes(activeTool)) {
      setCurrentPoint(pt);
    }
  }, [isPanning, isDrawing, activeTool, panStart, screenToSvg]);

  const handleMouseUp = useCallback(async () => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === "pen" && currentPoints.length > 1) {
      await saveMarkup("pen", { points: currentPoints, strokeWidth });
    } else if (activeTool === "cloud" && currentPoints.length > 1) {
      await saveMarkup("cloud", { points: currentPoints, strokeWidth });
    } else if (activeTool === "line" && startPoint && currentPoint) {
      await saveMarkup("line", { x1: startPoint.x, y1: startPoint.y, x2: currentPoint.x, y2: currentPoint.y, strokeWidth });
    } else if (activeTool === "arrow" && startPoint && currentPoint) {
      await saveMarkup("arrow", { x1: startPoint.x, y1: startPoint.y, x2: currentPoint.x, y2: currentPoint.y, strokeWidth });
    } else if (activeTool === "rectangle" && startPoint && currentPoint) {
      await saveMarkup("rectangle", {
        x: Math.min(startPoint.x, currentPoint.x),
        y: Math.min(startPoint.y, currentPoint.y),
        width: Math.abs(currentPoint.x - startPoint.x),
        height: Math.abs(currentPoint.y - startPoint.y),
        strokeWidth, filled: false,
      });
    } else if (activeTool === "circle" && startPoint && currentPoint) {
      const cx = (startPoint.x + currentPoint.x) / 2;
      const cy = (startPoint.y + currentPoint.y) / 2;
      await saveMarkup("circle", {
        cx, cy,
        rx: Math.abs(currentPoint.x - startPoint.x) / 2,
        ry: Math.abs(currentPoint.y - startPoint.y) / 2,
        strokeWidth, filled: false,
      });
    } else if (activeTool === "dimension" && startPoint && currentPoint) {
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      await saveMarkup("dimension", {
        x1: startPoint.x, y1: startPoint.y, x2: currentPoint.x, y2: currentPoint.y,
        distance: `${Math.round(dist)}px`, unit: "px",
      });
    }

    setCurrentPoints([]);
    setStartPoint(null);
    setCurrentPoint(null);
  }, [isPanning, isDrawing, activeTool, currentPoints, startPoint, currentPoint, strokeWidth]);

  const saveMarkup = async (type: string, data: any) => {
    try {
      const markup = await createMarkup({
        drawing_id: drawingId,
        revision_id: currentRevision,
        project_id: projectId,
        markup_type: type,
        data,
        color: activeColor,
        layer: "default",
        created_by: getCurrentUser(),
      });
      setMarkups((prev) => [...prev, markup]);
    } catch (e) {
      console.error("Failed to save markup:", e);
    }
  };

  const handleTextSubmit = async () => {
    if (!textPosition || !textInput.trim()) { setShowTextInput(false); return; }
    await saveMarkup(activeTool, {
      x: textPosition.x, y: textPosition.y,
      text: textInput, fontSize, fontWeight: "normal",
    });
    setShowTextInput(false);
    setTextInput("");
    setTextPosition(null);
  };

  const handleAddPin = async (position: Point, type: string) => {
    try {
      const pin = await createPin({
        drawing_id: drawingId,
        project_id: projectId,
        pin_type: type,
        x_percent: position.x,
        y_percent: position.y,
        label: `New ${type.replace("_", " ")}`,
        status: "open",
        color: type === "punch_list" ? "#EF4444" : type === "inspection" ? "#3B82F6" : "#F59E0B",
        created_by: getCurrentUser(),
      });
      setPins((prev) => [...prev, pin]);
    } catch (e) {
      console.error("Failed to create pin:", e);
    }
  };

  const handleDeleteMarkup = async (id: string) => {
    try {
      await deleteMarkup(id);
      setMarkups((prev) => prev.filter((m) => m.id !== id));
      setSelectedMarkupIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch (e) {
      console.error("Failed to delete markup:", e);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMarkupIds.size === 0) return;
    const ids = Array.from(selectedMarkupIds);
    try {
      await Promise.all(ids.map((id) => deleteMarkup(id)));
      setMarkups((prev) => prev.filter((m) => !selectedMarkupIds.has(m.id)));
      setSelectedMarkupIds(new Set());
    } catch (e) {
      console.error("Failed to delete selected markups:", e);
    }
  };

  const toggleMarkupSelection = (id: string) => {
    setSelectedMarkupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStampSelect = async (stampType: string) => {
    setActiveTool("stamp");
    // Wait for next click to place stamp
  };

  const handleDeletePin = async (id: string) => {
    try {
      await deletePin(id);
      setPins((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete pin:", e);
    }
  };

  const handleAddLayer = async () => {
    const name = prompt("Layer name:");
    if (!name) return;
    try {
      const layer = await createLayer({
        drawing_id: drawingId,
        project_id: projectId,
        name,
        color: activeColor,
        created_by: getCurrentUser(),
      });
      setLayers((prev) => [...prev, layer]);
    } catch (e) {
      console.error("Failed to create layer:", e);
    }
  };

  const handleToggleLayer = async (id: string, visible: boolean) => {
    try {
      await toggleLayerVisibility(id, visible);
      setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible } : l)));
    } catch (e) {
      console.error("Failed to toggle layer:", e);
    }
  };

  // Render markup SVG elements
  const renderMarkup = (m: any) => {
    if (!m.visible && m.visible !== undefined) return null;
    const d = m.data || {};
    const color = m.color || DEFAULT_COLOR;
    const sw = d.strokeWidth || 2;
    const key = m.id || Math.random();

    switch (m.markup_type) {
      case "pen":
        if (!d.points || d.points.length < 2) return null;
        const pathD = d.points.map((p: Point, i: number) =>
          `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
        ).join(" ");
        return <path key={key} d={pathD} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

      case "line":
        return <line key={key} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={color} strokeWidth={sw} />;

      case "arrow": {
        const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);
        const headLen = 12;
        return (
          <g key={key}>
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={color} strokeWidth={sw} />
            <polygon
              points={`${d.x2},${d.y2} ${d.x2 - headLen * Math.cos(angle - 0.4)},${d.y2 - headLen * Math.sin(angle - 0.4)} ${d.x2 - headLen * Math.cos(angle + 0.4)},${d.y2 - headLen * Math.sin(angle + 0.4)}`}
              fill={color}
            />
          </g>
        );
      }

      case "rectangle":
        return (
          <rect key={key} x={d.x} y={d.y} width={d.width} height={d.height}
            stroke={color} strokeWidth={sw} fill={d.filled ? color + "20" : "none"} />
        );

      case "circle":
        return (
          <ellipse key={key} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry}
            stroke={color} strokeWidth={sw} fill={d.filled ? color + "20" : "none"} />
        );

      case "cloud": {
        if (!d.points || d.points.length < 2) return null;
        // Simple cloud outline using arcs
        let cloudPath = "";
        for (let i = 0; i < d.points.length - 1; i++) {
          const p1 = d.points[i];
          const p2 = d.points[i + 1];
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const r = dist / 2;
          if (i === 0) cloudPath += `M ${p1.x} ${p1.y} `;
          cloudPath += `A ${r} ${r * 0.6} 0 0 1 ${p2.x} ${p2.y} `;
        }
        return <path key={key} d={cloudPath} stroke={color} strokeWidth={sw} fill="none" />;
      }

      case "text":
        return (
          <text key={key} x={d.x} y={d.y} fill={color} fontSize={d.fontSize || 14}
            fontWeight={d.fontWeight || "normal"} fontFamily="sans-serif">
            {d.text}
          </text>
        );

      case "callout": {
        const padding = 6;
        const textWidth = (d.text?.length || 5) * (d.fontSize || 14) * 0.55;
        const textHeight = (d.fontSize || 14) + padding * 2;
        return (
          <g key={key}>
            <rect x={d.x - padding} y={d.y - (d.fontSize || 14)} width={textWidth + padding * 2} height={textHeight}
              fill="white" stroke={color} strokeWidth={sw} rx={4} />
            <text x={d.x} y={d.y} fill={color} fontSize={d.fontSize || 14} fontFamily="sans-serif">
              {d.text}
            </text>
          </g>
        );
      }

      case "stamp": {
        const stamp = STAMP_TYPES.find((s) => s.value === d.stampType) || STAMP_TYPES[0];
        const scale = d.scale || 1;
        return (
          <g key={key} transform={`translate(${d.x}, ${d.y}) scale(${scale})`}>
            <rect x={-60} y={-18} width={120} height={36} rx={4}
              fill={stamp.bgColor} stroke={stamp.borderColor} strokeWidth={2} />
            <text textAnchor="middle" dominantBaseline="central" fill={stamp.borderColor}
              fontSize={14} fontWeight="bold" fontFamily="sans-serif">
              {stamp.label}
            </text>
          </g>
        );
      }

      case "dimension": {
        const dx = d.x2 - d.x1;
        const dy = d.y2 - d.y1;
        const angle = Math.atan2(dy, dx);
        const mx = (d.x1 + d.x2) / 2;
        const my = (d.y1 + d.y2) / 2;
        const offset = 15;
        const nx = -Math.sin(angle) * offset;
        const ny = Math.cos(angle) * offset;
        return (
          <g key={key}>
            <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} stroke={color} strokeWidth={1} strokeDasharray="4 2" />
            <line x1={d.x1} y1={d.y1} x2={d.x1 + nx} y2={d.y1 + ny} stroke={color} strokeWidth={1} />
            <line x1={d.x2} y1={d.y2} x2={d.x2 + nx} y2={d.y2 + ny} stroke={color} strokeWidth={1} />
            <rect x={mx - 30} y={my + ny - 10} width={60} height={20} fill="white" stroke={color} strokeWidth={1} rx={2} />
            <text x={mx} y={my + ny + 3} textAnchor="middle" fill={color} fontSize={11} fontFamily="sans-serif">
              {d.distance || "0"}
            </text>
          </g>
        );
      }

      case "hyperlink": {
        const w = d.width || 24;
        const h = d.height || 24;
        const isSelected = m.id && selectedMarkupIds.has(m.id);
        return (
          <g key={key} onClick={(e) => { e.stopPropagation(); if (m.id && activeTool === "select") toggleMarkupSelection(m.id); }}
            style={{ cursor: "pointer" }}>
            <rect x={d.x} y={d.y} width={w} height={h} rx={4}
              fill={color + "15"} stroke={isSelected ? "#FFFFFF" : color} strokeWidth={isSelected ? 2 : sw}
              strokeDasharray={isSelected ? "4 2" : "none"} />
            <svg x={d.x + (w - 16) / 2} y={d.y + (h - 16) / 2} width={16} height={16} viewBox="0 0 24 24"
              fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </g>
        );
      }

      default:
        return null;
    }
  };

  // Render in-progress drawing
  const renderCurrentDrawing = () => {
    if (!isDrawing) return null;

    if ((activeTool === "pen" || activeTool === "cloud") && currentPoints.length > 1) {
      const pathD = currentPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return <path d={pathD} stroke={activeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />;
    }

    if (startPoint && currentPoint) {
      if (activeTool === "line") {
        return <line x1={startPoint.x} y1={startPoint.y} x2={currentPoint.x} y2={currentPoint.y} stroke={activeColor} strokeWidth={strokeWidth} opacity={0.7} />;
      }
      if (activeTool === "arrow") {
        const angle = Math.atan2(currentPoint.y - startPoint.y, currentPoint.x - startPoint.x);
        const headLen = 12;
        return (
          <g opacity={0.7}>
            <line x1={startPoint.x} y1={startPoint.y} x2={currentPoint.x} y2={currentPoint.y} stroke={activeColor} strokeWidth={strokeWidth} />
            <polygon
              points={`${currentPoint.x},${currentPoint.y} ${currentPoint.x - headLen * Math.cos(angle - 0.4)},${currentPoint.y - headLen * Math.sin(angle - 0.4)} ${currentPoint.x - headLen * Math.cos(angle + 0.4)},${currentPoint.y - headLen * Math.sin(angle + 0.4)}`}
              fill={activeColor}
            />
          </g>
        );
      }
      if (activeTool === "rectangle") {
        return <rect x={Math.min(startPoint.x, currentPoint.x)} y={Math.min(startPoint.y, currentPoint.y)}
          width={Math.abs(currentPoint.x - startPoint.x)} height={Math.abs(currentPoint.y - startPoint.y)}
          stroke={activeColor} strokeWidth={strokeWidth} fill="none" opacity={0.7} />;
      }
      if (activeTool === "circle") {
        const cx = (startPoint.x + currentPoint.x) / 2;
        const cy = (startPoint.y + currentPoint.y) / 2;
        return <ellipse cx={cx} cy={cy}
          rx={Math.abs(currentPoint.x - startPoint.x) / 2}
          ry={Math.abs(currentPoint.y - startPoint.y) / 2}
          stroke={activeColor} strokeWidth={strokeWidth} fill="none" opacity={0.7} />;
      }
      if (activeTool === "dimension") {
        return <line x1={startPoint.x} y1={startPoint.y} x2={currentPoint.x} y2={currentPoint.y}
          stroke={activeColor} strokeWidth={1} strokeDasharray="4 2" opacity={0.7} />;
      }
    }
    return null;
  };

  const fileUrl = drawing?.file_url;
  const currentRevData = revisions.find((r) => r.id === currentRevision);
  const displayUrl = currentRevData?.file_url || fileUrl;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header bar */}
      <div className="h-12 bg-brand-navy flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-white text-sm font-semibold">{drawing?.drawing_number} — {drawing?.title}</h2>
            <p className="text-white/50 text-[10px]">Rev {drawing?.revision || "—"} | {drawing?.discipline || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Revision selector */}
          {revisions.length > 0 && (
            <select
              value={currentRevision || ""}
              onChange={(e) => setCurrentRevision(e.target.value)}
              className="px-2 py-1 bg-white/10 text-white text-xs rounded border border-white/20"
            >
              {revisions.map((r) => (
                <option key={r.id} value={r.id} className="text-gray-900">
                  {r.revision_number} ({r.status})
                </option>
              ))}
            </select>
          )}

          {/* Pin controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
            <button
              onClick={() => setAddPinMode(addPinMode === "punch_list" ? null : "punch_list")}
              className={cn("px-2 py-1 text-xs rounded", addPinMode === "punch_list" ? "bg-red-500 text-white" : "text-white/70 hover:text-white")}
              title="Drop punch list pin"
            >
              Punch Pin
            </button>
            <button
              onClick={() => setAddPinMode(addPinMode === "inspection" ? null : "inspection")}
              className={cn("px-2 py-1 text-xs rounded", addPinMode === "inspection" ? "bg-blue-500 text-white" : "text-white/70 hover:text-white")}
              title="Drop inspection pin"
            >
              Inspect Pin
            </button>
            <button
              onClick={() => setAddPinMode(addPinMode === "rfi" ? null : "rfi")}
              className={cn("px-2 py-1 text-xs rounded", addPinMode === "rfi" ? "bg-amber-500 text-white" : "text-white/70 hover:text-white")}
              title="Drop RFI pin"
            >
              RFI Pin
            </button>
          </div>

          {/* View controls */}
          <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
            <button onClick={() => setShowPins(!showPins)} className={cn("px-2 py-1 text-xs rounded", showPins ? "bg-white/20 text-white" : "text-white/50")}>
              Pins
            </button>
            <button onClick={() => setShowLayers(!showLayers)} className={cn("px-2 py-1 text-xs rounded", showLayers ? "bg-white/20 text-white" : "text-white/50")}>
              Layers
            </button>
            <button onClick={() => setShowRevisions(!showRevisions)} className={cn("px-2 py-1 text-xs rounded", showRevisions ? "bg-white/20 text-white" : "text-white/50")}>
              Revisions
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
            <button onClick={() => setZoom((z) => Math.max(z / 1.2, 0.1))} className="text-white/70 hover:text-white px-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
            </button>
            <span className="text-white text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(z * 1.2, 10))} className="text-white/70 hover:text-white px-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-white/50 hover:text-white px-1 text-xs">
              Fit
            </button>
          </div>

          <button onClick={onClose} className="ml-2 text-white/50 hover:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Markup toolbar */}
        <MarkupToolbar
          activeTool={activeTool}
          activeColor={activeColor}
          strokeWidth={strokeWidth}
          fontSize={fontSize}
          onToolChange={setActiveTool}
          onColorChange={setActiveColor}
          onStrokeWidthChange={setStrokeWidth}
          onFontSizeChange={setFontSize}
          onStampSelect={async (stampType) => {
            setActiveTool("stamp");
          }}
          onDeleteSelected={handleDeleteSelected}
        />

        {/* Drawing canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: addPinMode ? "crosshair" : activeTool === "select" ? (isPanning ? "grabbing" : "grab") : "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setIsPanning(false); if (isDrawing) handleMouseUp(); }}
          onWheel={handleWheel}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "relative",
              width: imgSize.width,
              height: imgSize.height,
            }}
          >
            {/* Drawing image */}
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={drawing?.title || "Drawing"}
                className="block"
                style={{ width: imgSize.width, height: imgSize.height, objectFit: "contain" }}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.naturalWidth && img.naturalHeight) {
                    setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }
                }}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  <p className="text-sm">No file uploaded for this drawing</p>
                </div>
              </div>
            )}

            {/* SVG overlay for markups */}
            <svg
              ref={svgRef}
              className="absolute inset-0"
              width={imgSize.width}
              height={imgSize.height}
              viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
              style={{ pointerEvents: activeTool === "select" && !addPinMode ? "none" : "auto" }}
            >
              {/* Saved markups */}
              {markups.map((m) => {
                const rendered = renderMarkup(m);
                if (!rendered || !m.id) return rendered;
                const isSelected = selectedMarkupIds.has(m.id);
                return (
                  <g key={m.id}
                    onClick={(e) => { if (activeTool === "select") { e.stopPropagation(); toggleMarkupSelection(m.id); } }}
                    style={{ cursor: activeTool === "select" ? "pointer" : undefined }}
                    opacity={isSelected ? 0.85 : 1}
                    filter={isSelected ? "url(#selectedGlow)" : undefined}
                  >
                    {rendered}
                  </g>
                );
              })}
              {/* Selection glow filter */}
              <defs>
                <filter id="selectedGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.8" />
                </filter>
              </defs>
              {/* Current drawing in progress */}
              {renderCurrentDrawing()}
            </svg>

            {/* Pin overlays */}
            {showPins && (
              <PunchListPinOverlay
                pins={pins}
                imgSize={imgSize}
                filter={pinFilter}
                onDelete={handleDeletePin}
                onUpdate={async (id, updates) => {
                  try {
                    const updated = await updatePin(id, updates);
                    setPins((prev) => prev.map((p) => (p.id === id ? updated : p)));
                  } catch (e) {
                    console.error("Failed to update pin:", e);
                  }
                }}
              />
            )}
          </div>

          {/* Text input overlay */}
          {showTextInput && textPosition && (
            <div
              className="absolute z-10"
              style={{
                left: textPosition.x * zoom + pan.x,
                top: textPosition.y * zoom + pan.y,
              }}
            >
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-48">
                <textarea
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full px-2 py-1 border border-gray-200 rounded text-sm resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
                    if (e.key === "Escape") setShowTextInput(false);
                  }}
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={() => setShowTextInput(false)} className="px-2 py-1 text-xs text-gray-400">Cancel</button>
                  <button onClick={handleTextSubmit} className="px-3 py-1 bg-brand-orange text-white text-xs rounded">Add</button>
                </div>
              </div>
            </div>
          )}

          {/* Pin mode indicator */}
          {addPinMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm">
              Click anywhere to place {addPinMode.replace("_", " ")} pin — ESC to cancel
            </div>
          )}
        </div>

        {/* Side panels */}
        {showLayers && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-navy">Layers</h3>
              <button onClick={handleAddLayer} className="text-brand-orange hover:text-brand-orange-dark text-xs">+ Add</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50">
                <input type="checkbox" checked={true} readOnly className="w-3.5 h-3.5 text-brand-orange rounded" />
                <span className="text-xs text-gray-600 flex-1">Default</span>
                <span className="text-[10px] text-gray-400">{markups.filter((m) => m.layer === "default").length}</span>
              </div>
              {layers.map((l) => (
                <div key={l.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={l.visible}
                    onChange={(e) => handleToggleLayer(l.id, e.target.checked)}
                    className="w-3.5 h-3.5 text-brand-orange rounded"
                  />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color || "#ccc" }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{l.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRevisions && (
          <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-brand-navy">Revisions</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {revisions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No revisions</p>
              ) : (
                revisions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setCurrentRevision(r.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                      currentRevision === r.id ? "bg-brand-orange/10 text-brand-orange" : "hover:bg-gray-50 text-gray-600"
                    )}
                  >
                    <div className="font-medium">{r.revision_number}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {r.status === "current" ? "Current" : "Superseded"} · {r.uploaded_by || "Unknown"}
                    </div>
                    {r.description && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{r.description}</div>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
