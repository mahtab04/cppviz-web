import { useState, useMemo } from "react";
import type { StructLayout, FieldInfo } from "../../../shared/types";
import { fieldColor, fieldColorSolid } from "../../../shared/utils/colors";

interface ByteGridProps {
  layout: StructLayout;
}

const CACHE_LINE_SIZE = 64;

export default function ByteGrid({ layout }: ByteGridProps) {
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showCacheLines, setShowCacheLines] = useState(true);
  const [showEndianness, setShowEndianness] = useState(false);
  const COLS = 8;

  // Non-padding fields for color indexing
  const realFields = useMemo(
    () => layout.fields.filter((f) => !f.is_padding),
    [layout.fields]
  );

  // Build a byte-to-field map
  const byteMap = useMemo(() => {
    const map: (FieldInfo | null)[] = new Array(layout.size).fill(null);
    for (const field of layout.fields) {
      for (let b = 0; b < field.size; b++) {
        const idx = field.offset + b;
        if (idx < layout.size) {
          map[idx] = field;
        }
      }
    }
    return map;
  }, [layout]);

  const rows = Math.ceil(layout.size / COLS);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold text-white">{layout.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            sizeof = {layout.size} | align = {layout.alignment} | data ={" "}
            {layout.data_size}
          </span>
          {/* Feature toggles */}
          <button
            onClick={() => setShowCacheLines(!showCacheLines)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              showCacheLines
                ? "bg-cyan-900/50 border-cyan-600 text-cyan-300"
                : "bg-gray-800 border-gray-600 text-gray-500 hover:text-gray-300"
            }`}
          >
            Cache Lines
          </button>
          <button
            onClick={() => setShowEndianness(!showEndianness)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              showEndianness
                ? "bg-purple-900/50 border-purple-600 text-purple-300"
                : "bg-gray-800 border-gray-600 text-gray-500 hover:text-gray-300"
            }`}
          >
            Endianness
          </button>
        </div>
      </div>

      {/* Endianness legend */}
      {showEndianness && (
        <div className="text-[10px] text-purple-300/70 bg-purple-900/10 border border-purple-800/30 rounded px-2 py-1">
          Little-endian (x86/x64): B0 = least significant byte (lowest
          address) → B<em>n</em> = most significant byte
        </div>
      )}

      {/* Column headers */}
      <div className="flex">
        <div className="w-14 flex-shrink-0" />
        {Array.from({ length: COLS }, (_, i) => (
          <div
            key={i}
            className="flex-1 text-center text-xs text-gray-500 font-mono"
          >
            +{i}
          </div>
        ))}
      </div>

      {/* Byte grid */}
      <div className="space-y-0.5">
        {Array.from({ length: rows }, (_, row) => {
          const offset = row * COLS;
          const isCacheBoundary =
            showCacheLines && offset > 0 && offset % CACHE_LINE_SIZE === 0;
          const cacheLineNum = Math.floor(offset / CACHE_LINE_SIZE);

          return (
            <div key={row}>
              {/* Cache line separator */}
              {isCacheBoundary && (
                <div className="flex items-center my-1">
                  <div className="w-14 flex-shrink-0 text-right pr-2 text-[9px] text-cyan-500 font-mono">
                    CL{cacheLineNum}
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-cyan-600/40" />
                </div>
              )}

              <div className="flex">
                {/* Offset label */}
                <div className="w-14 flex-shrink-0 text-right pr-2 text-xs text-gray-500 font-mono leading-8">
                  {offset}
                </div>
                {/* Bytes */}
                {Array.from({ length: COLS }, (_, col) => {
                  const byteIdx = offset + col;
                  if (byteIdx >= layout.size) {
                    return <div key={col} className="flex-1 h-8 m-0.5" />;
                  }
                  const field = byteMap[byteIdx];
                  const isPadding = field?.is_padding ?? false;
                  const fieldIdx = field
                    ? realFields.findIndex((f) => f.name === field.name)
                    : -1;
                  const bg = field
                    ? fieldColor(
                        field.name,
                        isPadding,
                        fieldIdx >= 0 ? fieldIdx : 0,
                        realFields.length
                      )
                    : "transparent";
                  const isHovered = field && hoveredField === field.name;
                  const isFirstByte = field && field.offset === byteIdx;
                  const byteInField = field ? byteIdx - field.offset : 0;

                  return (
                    <div
                      key={col}
                      className={`byte-cell flex-1 h-8 m-0.5 rounded-sm flex items-center justify-center text-[10px] font-mono cursor-pointer border ${
                        isHovered
                          ? "border-white ring-1 ring-white/50"
                          : "border-transparent"
                      } ${isPadding ? "padding-stripes" : ""}`}
                      style={{ backgroundColor: bg }}
                      onMouseEnter={() =>
                        field && setHoveredField(field.name)
                      }
                      onMouseLeave={() => setHoveredField(null)}
                      title={
                        field
                          ? `${field.name}: ${field.type}\nOffset: ${field.offset}, Size: ${field.size}${
                              showEndianness && !isPadding
                                ? `\nByte ${byteInField} of ${field.size} (${
                                    byteInField === 0
                                      ? "LSB"
                                      : byteInField === field.size - 1
                                        ? "MSB"
                                        : ""
                                  })`
                                : ""
                            }`
                          : `Byte ${byteIdx}: unused`
                      }
                    >
                      {showEndianness && field && !isPadding ? (
                        <span className="text-[9px] text-white/80 font-mono font-bold">
                          B{byteInField}
                        </span>
                      ) : isFirstByte && !isPadding ? (
                        <span className="truncate px-0.5 text-white/90">
                          {field!.name.length > 6
                            ? field!.name.slice(0, 5) + "…"
                            : field!.name}
                        </span>
                      ) : isPadding && isFirstByte ? (
                        <span className="text-red-300/70">pad</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cache line count */}
      {showCacheLines && layout.size > 0 && (
        <div className="text-[10px] text-cyan-500/60 text-right">
          Spans {Math.ceil(layout.size / CACHE_LINE_SIZE)} cache line
          {Math.ceil(layout.size / CACHE_LINE_SIZE) !== 1 ? "s" : ""} (
          {CACHE_LINE_SIZE}B each)
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
        {layout.fields.map((field, i) => {
          const fieldIdx = realFields.findIndex((f) => f.name === field.name);
          const color = fieldColorSolid(
            field.name,
            field.is_padding,
            fieldIdx >= 0 ? fieldIdx : 0,
            realFields.length
          );
          return (
            <div
              key={field.name + i}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-opacity ${
                hoveredField && hoveredField !== field.name
                  ? "opacity-40"
                  : "opacity-100"
              }`}
              onMouseEnter={() => setHoveredField(field.name)}
              onMouseLeave={() => setHoveredField(null)}
            >
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-300 font-mono">{field.name}</span>
              <span className="text-gray-500">
                {field.type} @ {field.offset} ({field.size}B)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
