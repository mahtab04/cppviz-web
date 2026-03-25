import { useMemo, useState } from "react";
import type { FunctionInfo } from "../../../shared/types";
import type { StackResponse } from "../../../shared/types";

interface StackFrameViewProps {
  data: StackResponse;
}

export default function StackFrameView({ data }: StackFrameViewProps) {
  if (data.functions.length === 0 && data.errors.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4">
        No functions found. Define at least one function with local variables.
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

      {data.functions.map((fn) => (
        <StackFrameCard key={fn.name} func={fn} />
      ))}
    </div>
  );
}

function StackFrameCard({ func }: { func: FunctionInfo }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Sort variables by offset (most negative first = bottom of stack)
  const sorted = useMemo(
    () => [...func.stack_frame].sort((a, b) => a.offset - b.offset),
    [func.stack_frame]
  );

  const minOffset = sorted.length > 0 ? sorted[0].offset : 0;
  const maxEnd =
    sorted.length > 0
      ? Math.max(...sorted.map((v) => v.offset + v.size))
      : 0;
  const totalSpan = maxEnd - minOffset || 1;

  const COLORS = [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#10b981",
    "#ec4899",
    "#f97316",
    "#14b8a6",
  ];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white font-mono">
          {func.name}()
        </h3>
        <span className="text-xs text-gray-400">
          Stack size: {func.total_stack_size} B
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">No local variables detected.</p>
      ) : (
        <div className="flex gap-6">
          {/* Visual stack bar */}
          <div className="relative w-48 flex-shrink-0">
            <div className="text-[10px] text-gray-500 mb-1 text-center">
              ↑ Higher addresses
            </div>
            <div className="relative border border-gray-600 rounded bg-gray-900">
              {/* Return address slot */}
              <div
                className="border-b border-gray-600 flex items-center justify-center text-[10px] text-gray-500 bg-gray-800"
                style={{ height: 24 }}
              >
                return addr
              </div>
              <div
                className="border-b border-gray-600 flex items-center justify-center text-[10px] text-gray-500 bg-gray-800"
                style={{ height: 24 }}
              >
                saved rbp
              </div>

              {/* Variables */}
              {sorted.map((v, i) => {
                const height = Math.max((v.size / totalSpan) * 200, 28);
                const color = COLORS[i % COLORS.length];
                return (
                  <div
                    key={`${v.name}_${v.offset}_${i}`}
                    className={`border-b border-gray-700 flex items-center px-2 text-xs font-mono transition-all cursor-pointer ${
                      hovered === v.name ? "ring-1 ring-white/40" : ""
                    }`}
                    style={{
                      height,
                      backgroundColor: color + "33",
                      borderLeft: `3px solid ${color}`,
                    }}
                    onMouseEnter={() => setHovered(v.name)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="truncate text-white/80">{v.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 text-center">
              ↓ Lower addresses (stack grows down)
            </div>
          </div>

          {/* Variable details table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase">
                  <th className="text-left py-1 px-2">Name</th>
                  <th className="text-left py-1 px-2">Type</th>
                  <th className="text-right py-1 px-2">Offset</th>
                  <th className="text-right py-1 px-2">Size</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((v, i) => (
                  <tr
                    key={`${v.name}_${v.offset}_${i}`}
                    className={`border-t border-gray-700 cursor-pointer transition-colors ${
                      hovered === v.name ? "bg-gray-700/50" : ""
                    }`}
                    onMouseEnter={() => setHovered(v.name)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <td className="py-1.5 px-2 font-mono">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-sm mr-2"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {v.name}
                      {v.is_pointer && (
                        <span className="ml-1 text-blue-400 text-xs">ptr</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-gray-400">
                      {v.type}
                      {v.points_to && (
                        <span className="text-blue-300"> → {v.points_to}</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                      {v.offset >= 0 ? "+" : ""}
                      {v.offset}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                      {v.size} B
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
