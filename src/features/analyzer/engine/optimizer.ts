/**
 * Struct field optimizer.
 *
 * Analyzes struct field ordering and suggests an optimal layout
 * that minimizes padding by sorting fields by alignment (descending).
 */

import type { TargetPlatform, StructLayout } from "../../../shared/types";
import type { ParsedRecord, ParsedField } from "../parser/parser";
import { parseRecords } from "../parser/parser";
import { analyzeLayout } from "./layout-engine";

/* ── Public types ── */

export interface OptimizationResult {
  structName: string;
  original: StructLayout;
  optimized: StructLayout;
  bytesSaved: number;
  reorderedFields: string[];
  optimizedCode: string;
}

/* ── Helpers ── */

function estimateAlignment(typeStr: string, pointerSize: number): number {
  const t = typeStr
    .replace(/\bconst\b/g, "")
    .replace(/\bvolatile\b/g, "")
    .trim();

  if (t.includes("*")) return pointerSize;

  const map: Record<string, number> = {
    "long double": 16,
    double: 8,
    "long long": 8,
    "unsigned long long": 8,
    "long long int": 8,
    "unsigned long long int": 8,
    int64_t: 8,
    uint64_t: 8,
    long: pointerSize,
    "unsigned long": pointerSize,
    "long int": pointerSize,
    "unsigned long int": pointerSize,
    size_t: pointerSize,
    ptrdiff_t: pointerSize,
    intptr_t: pointerSize,
    uintptr_t: pointerSize,
    int: 4,
    "unsigned int": 4,
    unsigned: 4,
    float: 4,
    int32_t: 4,
    uint32_t: 4,
    short: 2,
    "unsigned short": 2,
    "short int": 2,
    "unsigned short int": 2,
    int16_t: 2,
    uint16_t: 2,
    wchar_t: 2,
    char: 1,
    "unsigned char": 1,
    "signed char": 1,
    bool: 1,
    int8_t: 1,
    uint8_t: 1,
  };

  return map[t] ?? pointerSize;
}

function generateCode(
  record: ParsedRecord,
  fields: ParsedField[]
): string {
  const packed = record.isPacked ? " __attribute__((packed))" : "";
  const align = record.requestedAlignment
    ? ` alignas(${record.requestedAlignment})`
    : "";

  const bases = record.bases.length
    ? " : " +
      record.bases
        .map((b) => {
          const virt = b.isVirtual ? "virtual " : "";
          return `public ${virt}${b.name}`;
        })
        .join(", ")
    : "";

  const lines: string[] = [];
  lines.push(`${record.kind}${packed}${align} ${record.name}${bases} {`);

  for (const f of fields) {
    let decl = `    ${f.typeStr} ${f.name}`;
    if (f.arrayCount !== undefined) decl += `[${f.arrayCount}]`;
    if (f.bitWidth !== undefined) decl += ` : ${f.bitWidth}`;
    decl += ";";
    lines.push(decl);
  }

  lines.push("};");
  return lines.join("\n");
}

/* ── Public API ── */

/**
 * Compute optimized field ordering for all structs in the given code.
 * Returns one result per struct, including the bytes saved and
 * ready-to-copy optimized C++ code.
 */
export function optimizeStructs(
  code: string,
  target: TargetPlatform
): OptimizationResult[] {
  const pointerSize = target.startsWith("i386") ? 4 : 8;
  const records = parseRecords(code);
  const originals = analyzeLayout(records, target);
  const results: OptimizationResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const original = originals[i];

    // Strategy: sort by alignment descending, then name for stability
    const sorted = [...record.fields].sort((a, b) => {
      const aa = estimateAlignment(a.typeStr, pointerSize);
      const ab = estimateAlignment(b.typeStr, pointerSize);
      if (ab !== aa) return ab - aa;
      return a.name.localeCompare(b.name);
    });

    const changed = sorted.some(
      (f, idx) => f.name !== record.fields[idx].name
    );

    if (!changed) {
      results.push({
        structName: record.name,
        original,
        optimized: original,
        bytesSaved: 0,
        reorderedFields: record.fields.map((f) => f.name),
        optimizedCode: generateCode(record, record.fields),
      });
      continue;
    }

    const [optimized] = analyzeLayout(
      [{ ...record, fields: sorted }],
      target
    );

    results.push({
      structName: record.name,
      original,
      optimized,
      bytesSaved: original.size - optimized.size,
      reorderedFields: sorted.map((f) => f.name),
      optimizedCode: generateCode(record, sorted),
    });
  }

  return results;
}
