import { useState, useRef, useCallback } from "react";
import type { LayoutResponse, StructLayout } from "../../../shared/types";
import type { OptimizationResult } from "../../analyzer/engine/optimizer";
import ByteGrid from "./ByteGrid";
import LayoutStats from "./LayoutStats";

interface StructLayoutViewProps {
  data: LayoutResponse;
  optimizations?: OptimizationResult[];
}

export default function StructLayoutView({
  data,
  optimizations,
}: StructLayoutViewProps) {
  if (data.structs.length === 0 && data.errors.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No structs or classes found. Define at least one{" "}
        <code className="text-gray-400">struct</code> or{" "}
        <code className="text-gray-400">class</code> in your code.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {data.errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm">
          <p className="font-semibold text-red-400 mb-1">Compiler Errors</p>
          {data.errors.map((err, i) => (
            <p key={i} className="text-red-300 font-mono text-xs">
              Line {err.line}:{err.column} — {err.message}
            </p>
          ))}
        </div>
      )}

      {data.structs.map((s, i) => (
        <StructCard
          key={s.name}
          layout={s}
          optimization={optimizations?.[i]}
        />
      ))}
    </div>
  );
}

/* ── Per-struct card with export + optimization ── */

function StructCard({
  layout,
  optimization,
}: {
  layout: StructLayout;
  optimization?: OptimizationResult;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showOptCode, setShowOptCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* ── Export handlers ── */

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(layout, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layout.name}-layout.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  const handleExportPNG = useCallback(async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#1f2937",
        quality: 0.95,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${layout.name}-layout.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [layout.name, exporting]);

  const handleCopyCode = useCallback(() => {
    if (optimization?.optimizedCode) {
      navigator.clipboard.writeText(optimization.optimizedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [optimization?.optimizedCode]);

  return (
    <div
      ref={cardRef}
      className="bg-gray-850 rounded-xl border border-gray-700 p-4 space-y-4"
    >
      <LayoutStats layout={layout} />

      {/* Export toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportJSON}
          className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title="Download layout data as JSON"
        >
          📋 JSON
        </button>
        <button
          onClick={handleExportPNG}
          disabled={exporting}
          className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-300 rounded transition-colors"
          title="Download visualization as PNG image"
        >
          {exporting ? "⏳ Exporting…" : "🖼 PNG"}
        </button>
      </div>

      <ByteGrid layout={layout} />

      {/* Optimization panel */}
      {optimization && (
        <OptimizationPanel
          result={optimization}
          showCode={showOptCode}
          onToggleCode={() => setShowOptCode(!showOptCode)}
          copied={copied}
          onCopyCode={handleCopyCode}
        />
      )}
    </div>
  );
}

/* ── Optimization suggestion panel ── */

function OptimizationPanel({
  result,
  showCode,
  onToggleCode,
  copied,
  onCopyCode,
}: {
  result: OptimizationResult;
  showCode: boolean;
  onToggleCode: () => void;
  copied: boolean;
  onCopyCode: () => void;
}) {
  if (result.bytesSaved <= 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700/50 rounded-lg text-sm text-green-300">
        <span>✓</span>
        <span>
          Already optimal — no padding can be saved by reordering fields
        </span>
      </div>
    );
  }

  const paddingBefore = result.original.fields
    .filter((f) => f.is_padding)
    .reduce((s, f) => s + f.size, 0);
  const paddingAfter = result.optimized.fields
    .filter((f) => f.is_padding)
    .reduce((s, f) => s + f.size, 0);

  return (
    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-blue-400 font-semibold text-sm">
            💡 Optimization Available
          </span>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            Save {result.bytesSaved}B
          </span>
          <span className="text-xs text-gray-400">
            {result.original.size}B → {result.optimized.size}B
          </span>
          <span className="text-xs text-gray-500">
            (padding: {paddingBefore}B → {paddingAfter}B)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleCode}
            className="px-2 py-1 text-xs bg-blue-800 hover:bg-blue-700 text-blue-200 rounded transition-colors"
          >
            {showCode ? "Hide" : "Show"} Code
          </button>
          <button
            onClick={onCopyCode}
            className="px-2 py-1 text-xs bg-blue-800 hover:bg-blue-700 text-blue-200 rounded transition-colors"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Suggested order:{" "}
        <span className="text-blue-300 font-mono">
          {result.reorderedFields.join(" → ")}
        </span>
      </div>

      {showCode && (
        <pre className="bg-gray-900 rounded p-3 text-sm font-mono text-green-300 overflow-auto max-h-[200px] border border-gray-700">
          {result.optimizedCode}
        </pre>
      )}
    </div>
  );
}
