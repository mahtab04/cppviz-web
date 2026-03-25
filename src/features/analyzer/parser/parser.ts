/**
 * Minimal C++ declaration parser.
 *
 * Extracts struct / class / union declarations with their fields,
 * base classes, and virtual-function markers from source code.
 *
 * This is NOT a full C++ parser – it handles the subset of constructs
 * that matter for memory-layout visualisation.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ParsedField {
  name: string;
  typeStr: string;
  /** e.g. `int x[10]` → arrayCount = 10 */
  arrayCount?: number;
  /** bitfield width, if any */
  bitWidth?: number;
}

export interface ParsedBase {
  name: string;
  isVirtual: boolean;
}

export interface ParsedRecord {
  kind: "struct" | "class" | "union";
  name: string;
  fields: ParsedField[];
  bases: ParsedBase[];
  hasVirtualMethod: boolean;
  isPacked: boolean;
  /** The alignment requested via alignas(N) or __declspec(align(N)) */
  requestedAlignment?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Strip // and /* comments, preserving newlines so line counts stay intact. */
export function stripComments(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    const n = code[i + 1] ?? "";

    // line comment
    if (c === "/" && n === "/") {
      while (i < code.length && code[i] !== "\n") i++;
      continue;
    }
    // block comment
    if (c === "/" && n === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
        out += code[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < code.length) {
        out += "  "; // replace closing */
        i += 2;
      }
      continue;
    }
    // string literal
    if (c === '"') {
      out += c;
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\") {
          out += code[i++];
        }
        out += code[i++];
      }
      if (i < code.length) out += code[i++]; // closing "
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Find the matching `}` for the `{` at position `pos`. */
function findMatchingBrace(code: string, pos: number): number {
  let depth = 0;
  for (let i = pos; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/* ------------------------------------------------------------------ */
/*  Main parser                                                        */
/* ------------------------------------------------------------------  */

export function parseRecords(code: string): ParsedRecord[] {
  const clean = stripComments(code);
  const records: ParsedRecord[] = [];

  // Match: [packed-attr] (struct|class|union) [alignas(N)] Name [: bases] {
  const headerRe =
    /(?:__attribute__\s*\(\s*\(\s*packed\s*\)\s*\)\s*)?(?:__attribute__\s*\(\s*\([^)]*\)\s*\)\s*)*(struct|class|union)\s+(?:alignas\s*\(\s*(\d+)\s*\)\s+)?(?:__declspec\s*\(\s*align\s*\(\s*(\d+)\s*\)\s*\)\s+)?([A-Za-z_]\w*)\s*(?::([^{]*))?(?=\s*\{)/g;

  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(clean)) !== null) {
    const kind = m[1] as "struct" | "class" | "union";
    const alignas1 = m[2] ? parseInt(m[2]) : undefined;
    const alignas2 = m[3] ? parseInt(m[3]) : undefined;
    const name = m[4];
    const basesStr = m[5] ?? "";

    const isPacked =
      clean
        .slice(Math.max(0, m.index - 60), m.index)
        .includes("packed") ||
      clean
        .slice(m.index, m.index + m[0].length + 5)
        .includes("packed");

    // Find the body between { }
    const openBrace = clean.indexOf("{", m.index + m[0].length - 1);
    if (openBrace < 0) continue;
    const closeBrace = findMatchingBrace(clean, openBrace);
    if (closeBrace < 0) continue;

    const body = clean.slice(openBrace + 1, closeBrace);

    // Parse base classes
    const bases: ParsedBase[] = [];
    if (basesStr.trim()) {
      for (const part of basesStr.split(",")) {
        const t = part.trim();
        const isVirtual = /\bvirtual\b/.test(t);
        // strip qualifiers
        const baseName = t
          .replace(/\b(public|protected|private|virtual)\b/g, "")
          .trim();
        if (baseName) bases.push({ name: baseName, isVirtual });
      }
    }

    // Detect virtual methods
    const hasVirtualMethod = /\bvirtual\b/.test(body);

    // Parse fields
    const fields = parseFields(body);

    records.push({
      kind,
      name,
      fields,
      bases,
      hasVirtualMethod,
      isPacked,
      requestedAlignment: alignas1 ?? alignas2,
    });
  }

  return records;
}

/* ------------------------------------------------------------------ */
/*  Field parser                                                       */
/* ------------------------------------------------------------------ */

function parseFields(body: string): ParsedField[] {
  const fields: ParsedField[] = [];

  // Remove nested struct/class/union bodies (we parse them at top level)
  let flat = body;
  {
    let idx = 0;
    while (idx < flat.length) {
      const next = flat.indexOf("{", idx);
      if (next < 0) break;
      const close = findMatchingBrace(flat, next);
      if (close < 0) break;
      flat = flat.slice(0, next) + flat.slice(close + 1);
      idx = next;
    }
  }

  // Remove method declarations (lines with `(` before `;`)
  // and access specifiers
  const lines = flat.split(";").map((s) => s.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip access specifiers, methods, using, typedef, etc.
    if (/^\s*(public|private|protected)\s*:/.test(line)) continue;
    if (/\bvirtual\b/.test(line) && /\(/.test(line)) continue;
    if (/\(/.test(line)) continue; // any function signature
    if (/^\s*(using|typedef|template|static_assert|friend)\b/.test(line)) continue;
    if (/^\s*(enum|struct|class|union)\b/.test(line)) continue;

    // Now attempt to parse as a field declaration
    // e.g. `int x`, `double* p`, `char buf[16]`, `int x : 3`
    const trimmed = line
      .replace(/\bstatic\b/g, "")
      .replace(/\bmutable\b/g, "")
      .replace(/\binline\b/g, "")
      .replace(/\bconstexpr\b/g, "")
      .trim();

    if (!trimmed) continue;

    // Bitfield: `type name : width`
    const bfMatch = trimmed.match(
      /^(.+?)\s+([A-Za-z_]\w*)\s*:\s*(\d+)\s*$/
    );
    if (bfMatch) {
      fields.push({
        name: bfMatch[2],
        typeStr: bfMatch[1].trim(),
        bitWidth: parseInt(bfMatch[3]),
      });
      continue;
    }

    // Array: `type name[N]`
    const arrMatch = trimmed.match(
      /^(.+?)\s+([A-Za-z_]\w*)\s*\[\s*(\d+)\s*\]\s*$/
    );
    if (arrMatch) {
      fields.push({
        name: arrMatch[2],
        typeStr: arrMatch[1].trim(),
        arrayCount: parseInt(arrMatch[3]),
      });
      continue;
    }

    // Pointer / reference with possible `= init`
    const initMatch = trimmed.match(
      /^(.+?)\s+([A-Za-z_]\w*)\s*(?:=.*)?$/
    );
    if (initMatch) {
      const typeStr = initMatch[1].trim();
      const varName = initMatch[2];

      // Reject lines where "type" is actually another keyword
      if (
        /^(return|if|for|while|else|switch|case|do|break|continue|goto|delete|throw|new|nullptr)$/.test(
          typeStr
        )
      )
        continue;

      fields.push({ name: varName, typeStr });
      continue;
    }
  }

  return fields;
}
