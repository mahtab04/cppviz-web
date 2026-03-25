/**
 * Stack-frame analyser.
 *
 * Extracts functions and their local variables from C++ source using
 * regex-based heuristics (ported from C++ analyzer).
 */

import type { TargetPlatform, FunctionInfo, StackVariable } from "../../../shared/types";
import { stripComments } from "../parser/parser";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function alignUp(value: number, align: number): number {
  if (align <= 1) return value;
  return Math.ceil(value / align) * align;
}

const CONTROL_KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "else",
  "constexpr", "sizeof", "alignof", "decltype", "typeid",
  "noexcept", "static_assert", "co_await", "co_yield",
]);

const SKIP_KEYWORDS = new Set([
  "return", "if", "for", "while", "else", "switch",
  "case", "do", "delete", "throw", "break", "continue",
  "goto", "using", "typedef", "template", "namespace",
]);

function inferTypeSize(typeStr: string, target: TargetPlatform): number {
  const pointerSize =
    target === "i386-linux-gnu" || target === "i386-pc-windows-msvc" ? 4 : 8;
  const isMSVC =
    target === "x86_64-pc-windows-msvc" || target === "i386-pc-windows-msvc";
  const is32 =
    target === "i386-linux-gnu" || target === "i386-pc-windows-msvc";

  let t = typeStr
    .replace(/\bconst\b/g, "")
    .replace(/\bvolatile\b/g, "")
    .replace(/\bstatic\b/g, "")
    .replace(/\bregister\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (t.includes("*")) return pointerSize;

  const sizes: Record<string, number> = {
    char: 1, "signed char": 1, "unsigned char": 1, bool: 1,
    int8_t: 1, uint8_t: 1,
    short: 2, "unsigned short": 2, int16_t: 2, uint16_t: 2,
    wchar_t: isMSVC ? 2 : 4,
    int: 4, "unsigned int": 4, unsigned: 4, float: 4,
    int32_t: 4, uint32_t: 4,
    long: isMSVC ? 4 : (is32 ? 4 : 8),
    "unsigned long": isMSVC ? 4 : (is32 ? 4 : 8),
    "long long": 8, "unsigned long long": 8,
    int64_t: 8, uint64_t: 8,
    double: 8,
    "long double": isMSVC ? 8 : (is32 ? 12 : 16),
    size_t: pointerSize, ptrdiff_t: pointerSize,
    auto: pointerSize,
  };

  if (sizes[t] !== undefined) return sizes[t];

  // Array: type[N]
  const arrMatch = t.match(/^(.+)\[(\d+)\]$/);
  if (arrMatch) {
    const elem = inferTypeSize(arrMatch[1].trim(), target);
    return Math.max(1, elem) * parseInt(arrMatch[2]);
  }

  return pointerSize; // unknown → guess pointer-sized
}

/* ------------------------------------------------------------------ */
/*  Find matching brace                                                */
/* ------------------------------------------------------------------ */

function findMatchingBrace(text: string, openPos: number): number {
  let depth = 0;
  for (let i = openPos; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/* ------------------------------------------------------------------ */
/*  Main analyser                                                      */
/* ------------------------------------------------------------------ */

export function analyzeStack(
  code: string,
  target: TargetPlatform
): FunctionInfo[] {
  const scan = stripComments(code);
  const functions: FunctionInfo[] = [];

  // Match function headers: `name ( params ) [const] {`
  const fnRe = /([A-Za-z_]\w*)\s*\([^;{}]*\)\s*(?:const\s*)?\{/g;
  let m: RegExpExecArray | null;

  while ((m = fnRe.exec(scan)) !== null) {
    const fnName = m[1];
    if (CONTROL_KEYWORDS.has(fnName)) continue;

    const openBrace = m.index + m[0].length - 1;
    const closeBrace = findMatchingBrace(scan, openBrace);
    if (closeBrace < 0) continue;

    const body = scan.slice(openBrace + 1, closeBrace);

    // Extract local variable declarations
    const declRe =
      /(^|[\n;{}])\s*([A-Za-z_][\w:<>,\s*&[\]]*?)\s+([A-Za-z_]\w*)\s*(=[^;]*)?;/g;
    let dm: RegExpExecArray | null;
    const stackVars: StackVariable[] = [];
    let used = 0;

    while ((dm = declRe.exec(body)) !== null) {
      const rawType = dm[2].trim();
      const varName = dm[3].trim();

      if (!rawType || !varName) continue;
      if (SKIP_KEYWORDS.has(rawType)) continue;

      const size = Math.max(1, inferTypeSize(rawType, target));
      const slot = alignUp(size, Math.min(8, size));
      used += slot;

      const isPtr = rawType.includes("*");
      stackVars.push({
        name: varName,
        type: rawType,
        offset: -used,
        size,
        is_pointer: isPtr,
        points_to: null,
      });
    }

    const totalStackSize = alignUp(Math.max(used, 0), 16);
    functions.push({
      name: fnName,
      stack_frame: stackVars,
      total_stack_size: totalStackSize,
    });
  }

  return functions;
}
