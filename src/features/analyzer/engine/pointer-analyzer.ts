/**
 * Pointer / heap-allocation analyser.
 *
 * Detects `new` and `malloc` expressions and builds allocation +
 * pointer-relation tables (ported from C++ analyzer).
 */

import type {
  TargetPlatform,
  HeapAllocation,
  PointerRelation,
} from "../../../shared/types";
import { stripComments } from "../parser/parser";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PRIM_SIZES: Record<string, number> = {
  char: 1, "signed char": 1, "unsigned char": 1, bool: 1,
  short: 2, "unsigned short": 2,
  int: 4, "unsigned int": 4, float: 4,
  long: 8, "unsigned long": 8,
  "long long": 8, "unsigned long long": 8,
  double: 8, "long double": 16,
};

function estimateSize(typeName: string): number {
  const cleaned = typeName
    .replace(/\bconst\b/g, "")
    .replace(/\bvolatile\b/g, "")
    .trim();
  return PRIM_SIZES[cleaned] ?? 0;
}

/* ------------------------------------------------------------------ */
/*  Main analyser                                                      */
/* ------------------------------------------------------------------ */

export function analyzePointers(
  code: string,
  _target: TargetPlatform
): { allocations: HeapAllocation[]; relations: PointerRelation[] } {
  const source = stripComments(code);
  const lines = source.split("\n");

  const allocations: HeapAllocation[] = [];
  const relations: PointerRelation[] = [];

  // Matches: [type] var = new Type[N]?  or  auto var = new Type
  const newRe =
    /(?:\b(?:auto|[A-Za-z_][\w:<>]*(?:\s*[*&])?)\b\s+)?([A-Za-z_]\w*)\s*=\s*new\s+([A-Za-z_][\w:<>]*)\s*(\[\s*\d+\s*\])?/;

  // Matches: [type] var = [(cast*)]malloc(...)
  const mallocRe =
    /(?:\b(?:auto|[A-Za-z_][\w:<>]*(?:\s*[*&])?)\b\s+)?([A-Za-z_]\w*)\s*=\s*(?:\(\s*([A-Za-z_][\w:<>]*)\s*\*\s*\)\s*)?malloc\s*\(([^)]*)\)/;

  let allocIdx = 0;

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo];
    let m: RegExpExecArray | null;

    // ── new ──
    m = newRe.exec(line);
    if (m) {
      const variable = m[1];
      const baseType = m[2];
      const arrSuffix = m[3] ?? "";

      let elemSize = estimateSize(baseType);
      let totalSize = elemSize;

      if (arrSuffix) {
        const countMatch = arrSuffix.match(/\[(\d+)\]/);
        if (countMatch) {
          const count = parseInt(countMatch[1]);
          totalSize = elemSize > 0 ? elemSize * count : 0;
        } else {
          totalSize = 0;
        }
      }

      const allocId = `heap_${++allocIdx}`;
      allocations.push({
        id: allocId,
        type: baseType + (arrSuffix ? arrSuffix.replace(/\s/g, "") : ""),
        size: totalSize > 0 ? totalSize : 0,
        source_line: lineNo + 1,
      });
      relations.push({
        from_variable: variable,
        to_allocation_id: allocId,
        to_variable: null,
        relation_type: "owns",
      });
      continue;
    }

    // ── malloc ──
    m = mallocRe.exec(line);
    if (m) {
      const variable = m[1];
      const castType = m[2] ?? "void";
      const mallocArg = m[3].trim();

      let totalSize = 0;
      const numMatch = mallocArg.match(/(\d+)/);
      if (numMatch) totalSize = parseInt(numMatch[1]);

      const allocId = `heap_${++allocIdx}`;
      allocations.push({
        id: allocId,
        type: castType + "*",
        size: totalSize,
        source_line: lineNo + 1,
      });
      relations.push({
        from_variable: variable,
        to_allocation_id: allocId,
        to_variable: null,
        relation_type: "owns",
      });
    }
  }

  return { allocations, relations };
}
