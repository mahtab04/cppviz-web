import type { PointerResponse } from "../../../shared/types";

interface MemoryMapViewProps {
  data: PointerResponse;
}

export default function MemoryMapView({ data }: MemoryMapViewProps) {
  if (
    data.allocations.length === 0 &&
    data.relations.length === 0 &&
    data.errors.length === 0
  ) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No heap allocations or pointer relationships found. Use{" "}
        <code className="text-gray-400">new</code>,{" "}
        <code className="text-gray-400">malloc</code>, or pointer variables
        in your code.
      </div>
    );
  }

  // Build a map of allocation ID → allocation
  const allocMap = new Map(data.allocations.map((a) => [a.id, a]));

  return (
    <div className="space-y-4 p-4">
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

      <div className="flex gap-8 items-start">
        {/* Stack side — pointer variables */}
        <div className="space-y-2 min-w-[180px]">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Stack (Pointers)
          </h3>
          {data.relations.length === 0 ? (
            <p className="text-gray-500 text-xs">No pointer variables found.</p>
          ) : (
            data.relations.map((rel, i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="font-mono text-sm text-white">
                  {rel.from_variable}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                <span className="text-xs text-gray-400">
                  {rel.relation_type === "owns" ? "owns" : "→"}{" "}
                  {rel.to_allocation_id
                    ? allocMap.get(rel.to_allocation_id)?.type ?? "heap"
                    : rel.to_variable ?? "?"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Connecting arrows (simple SVG) */}
        {data.relations.length > 0 && data.allocations.length > 0 && (
          <div className="flex items-center">
            <svg width="60" height={Math.max(data.relations.length, data.allocations.length) * 60} className="flex-shrink-0">
              {data.relations.map((rel, i) => {
                const allocIdx = data.allocations.findIndex(
                  (a) => a.id === rel.to_allocation_id
                );
                const y1 = i * 60 + 20;
                const y2 = allocIdx >= 0 ? allocIdx * 60 + 20 : y1;
                return (
                  <g key={i}>
                    <line
                      x1={0}
                      y1={y1}
                      x2={60}
                      y2={y2}
                      stroke={rel.relation_type === "owns" ? "#f59e0b" : "#3b82f6"}
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
              </defs>
            </svg>
          </div>
        )}

        {/* Heap side — allocations */}
        <div className="space-y-2 min-w-[200px]">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Heap (Allocations)
          </h3>
          {data.allocations.length === 0 ? (
            <p className="text-gray-500 text-xs">No heap allocations found.</p>
          ) : (
            data.allocations.map((alloc) => (
              <div
                key={alloc.id}
                className="bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="font-mono text-sm text-white">
                    {alloc.type}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1 ml-4">
                  {alloc.size > 0 ? `${alloc.size} bytes` : "size unknown"}
                  {alloc.source_line > 0 && ` • line ${alloc.source_line}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-amber-500" />
          owns (new/malloc)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-blue-500" />
          references
        </div>
      </div>
    </div>
  );
}
