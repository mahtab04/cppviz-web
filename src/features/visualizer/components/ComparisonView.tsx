import { useState, useMemo } from "react";
import type { TargetPlatform } from "../../../shared/types";
import { TARGET_LABELS } from "../../../shared/types";
import { parseRecords, analyzeLayout } from "../../analyzer";
import ByteGrid from "./ByteGrid";

interface ComparisonViewProps {
  code: string;
}

export default function ComparisonView({ code }: ComparisonViewProps) {
  const [targetA, setTargetA] = useState<TargetPlatform>("x86_64-linux-gnu");
  const [targetB, setTargetB] = useState<TargetPlatform>(
    "x86_64-pc-windows-msvc"
  );

  const records = useMemo(() => parseRecords(code), [code]);

  const layoutsA = useMemo(
    () => (records.length > 0 ? analyzeLayout(records, targetA) : []),
    [records, targetA]
  );

  const layoutsB = useMemo(
    () => (records.length > 0 ? analyzeLayout(records, targetB) : []),
    [records, targetB]
  );

  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        <div className="text-center space-y-2">
          <p className="text-lg">🔀</p>
          <p>
            No structs or classes found for comparison.
          </p>
          <p className="text-xs text-gray-600">
            Define at least one struct, then click <strong>Analyze</strong>
          </p>
        </div>
      </div>
    );
  }

  const targets = Object.entries(TARGET_LABELS) as [TargetPlatform, string][];

  return (
    <div className="space-y-4 p-4">
      {/* Target selectors */}
      <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-3 border border-gray-700 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          Left:
          <select
            value={targetA}
            onChange={(e) => setTargetA(e.target.value as TargetPlatform)}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
          >
            {targets.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <span className="text-gray-500 text-lg font-bold">⇄</span>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          Right:
          <select
            value={targetB}
            onChange={(e) => setTargetB(e.target.value as TargetPlatform)}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
          >
            {targets.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>

        {targetA === targetB && (
          <span className="text-xs text-yellow-400">
            ⚠ Same target on both sides
          </span>
        )}
      </div>

      {/* Side-by-side structs */}
      {layoutsA.map((layoutA, i) => {
        const layoutB = layoutsB[i];
        if (!layoutB) return null;

        const sizeDiff = layoutA.size !== layoutB.size;
        const alignDiff = layoutA.alignment !== layoutB.alignment;
        const paddingA = layoutA.fields
          .filter((f) => f.is_padding)
          .reduce((s, f) => s + f.size, 0);
        const paddingB = layoutB.fields
          .filter((f) => f.is_padding)
          .reduce((s, f) => s + f.size, 0);
        const paddingDiff = paddingA !== paddingB;

        return (
          <div key={layoutA.name} className="space-y-2">
            {/* Diff summary */}
            {(sizeDiff || alignDiff || paddingDiff) ? (
              <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-3 py-2 text-sm flex-wrap">
                <span className="text-yellow-400 font-semibold">
                  ⚠ {layoutA.name}
                </span>
                {sizeDiff && (
                  <span className="text-yellow-300 text-xs bg-yellow-800/40 px-2 py-0.5 rounded">
                    Size: {layoutA.size}B vs {layoutB.size}B
                  </span>
                )}
                {alignDiff && (
                  <span className="text-yellow-300 text-xs bg-yellow-800/40 px-2 py-0.5 rounded">
                    Align: {layoutA.alignment} vs {layoutB.alignment}
                  </span>
                )}
                {paddingDiff && (
                  <span className="text-yellow-300 text-xs bg-yellow-800/40 px-2 py-0.5 rounded">
                    Padding: {paddingA}B vs {paddingB}B
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/50 rounded-lg px-3 py-2 text-sm text-green-300">
                <span>✓</span>
                <span>{layoutA.name}: Identical layout on both platforms</span>
              </div>
            )}

            {/* Side-by-side grids */}
            <div className="grid grid-cols-2 gap-3">
              {/* Left */}
              <div className="bg-gray-800 rounded-xl border border-blue-800/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-400 font-semibold uppercase tracking-wide">
                    {TARGET_LABELS[targetA]}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {layoutA.size}B / align {layoutA.alignment} / pad {paddingA}B
                  </span>
                </div>
                <ByteGrid layout={layoutA} />
              </div>

              {/* Right */}
              <div className="bg-gray-800 rounded-xl border border-purple-800/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wide">
                    {TARGET_LABELS[targetB]}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {layoutB.size}B / align {layoutB.alignment} / pad {paddingB}B
                  </span>
                </div>
                <ByteGrid layout={layoutB} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
