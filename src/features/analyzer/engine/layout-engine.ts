/**
 * C++ struct / class / union memory-layout engine.
 *
 * Implements Itanium ABI (Linux) and MSVC ABI layout rules:
 *   - natural-alignment padding
 *   - vtable pointers
 *   - base-class sub-objects
 *   - bitfield packing
 *   - __attribute__((packed)) / #pragma pack(1)
 *   - array fields
 *   - alignas(N)
 */

import type { TargetPlatform, StructLayout, FieldInfo, BaseClassInfo } from "../../../shared/types";
import type { ParsedRecord } from "../parser/parser";

/* ================================================================== */
/*  Target-dependent size / alignment tables                           */
/* ================================================================== */

interface TypeMetrics {
  size: number;
  align: number;
}

interface TargetInfo {
  pointerSize: number;
  /** size & natural alignment for every primitive C++ type */
  primitives: Record<string, TypeMetrics>;
  /** MSVC uses different alignment for long, wchar_t, etc. */
  isMSVC: boolean;
}

function targetInfo(target: TargetPlatform): TargetInfo {
  const is32 =
    target === "i386-linux-gnu" || target === "i386-pc-windows-msvc";
  const isMSVC =
    target === "x86_64-pc-windows-msvc" || target === "i386-pc-windows-msvc";
  const ptr = is32 ? 4 : 8;

  // long is 4 on MSVC and 32-bit, 8 on 64-bit Linux
  const longSize = isMSVC ? 4 : is32 ? 4 : 8;
  const wcharSize = isMSVC ? 2 : 4;

  const primitives: Record<string, TypeMetrics> = {
    bool:                   { size: 1, align: 1 },
    char:                   { size: 1, align: 1 },
    "signed char":          { size: 1, align: 1 },
    "unsigned char":        { size: 1, align: 1 },
    int8_t:                 { size: 1, align: 1 },
    uint8_t:                { size: 1, align: 1 },
    short:                  { size: 2, align: 2 },
    "unsigned short":       { size: 2, align: 2 },
    "short int":            { size: 2, align: 2 },
    "unsigned short int":   { size: 2, align: 2 },
    int16_t:                { size: 2, align: 2 },
    uint16_t:               { size: 2, align: 2 },
    wchar_t:                { size: wcharSize, align: wcharSize },
    int:                    { size: 4, align: 4 },
    "unsigned int":         { size: 4, align: 4 },
    unsigned:               { size: 4, align: 4 },
    int32_t:                { size: 4, align: 4 },
    uint32_t:               { size: 4, align: 4 },
    float:                  { size: 4, align: 4 },
    long:                   { size: longSize, align: longSize },
    "unsigned long":        { size: longSize, align: longSize },
    "long int":             { size: longSize, align: longSize },
    "unsigned long int":    { size: longSize, align: longSize },
    "long long":            { size: 8, align: 8 },
    "unsigned long long":   { size: 8, align: 8 },
    "long long int":        { size: 8, align: 8 },
    "unsigned long long int": { size: 8, align: 8 },
    int64_t:                { size: 8, align: 8 },
    uint64_t:               { size: 8, align: 8 },
    double:                 { size: 8, align: 8 },
    "long double":          { size: isMSVC ? 8 : (is32 ? 12 : 16),
                              align: isMSVC ? 8 : (is32 ? 4 : 16) },
    size_t:                 { size: ptr, align: ptr },
    ptrdiff_t:              { size: ptr, align: ptr },
    intptr_t:               { size: ptr, align: ptr },
    uintptr_t:              { size: ptr, align: ptr },
  };

  return { pointerSize: ptr, primitives, isMSVC };
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function alignUp(value: number, align: number): number {
  if (align <= 1) return value;
  return Math.ceil(value / align) * align;
}

/** Normalise a C++ type string so it matches our primitives table. */
function normaliseType(raw: string): string {
  let t = raw
    .replace(/\bconst\b/g, "")
    .replace(/\bvolatile\b/g, "")
    .replace(/\bstatic\b/g, "")
    .replace(/\bregister\b/g, "")
    .replace(/\bmutable\b/g, "")
    .replace(/\binline\b/g, "")
    .replace(/\bconstexpr\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // Remove trailing & (reference)
  t = t.replace(/\s*&+$/, "");
  return t;
}

/* ================================================================== */
/*  Resolve type → (size, alignment)                                   */
/* ================================================================== */

function resolveType(
  raw: string,
  ti: TargetInfo,
  recordMap: Map<string, StructLayout>
): TypeMetrics {
  const t = normaliseType(raw);

  // Pointer or reference
  if (t.includes("*")) {
    return { size: ti.pointerSize, align: ti.pointerSize };
  }

  // Primitive
  const prim = ti.primitives[t];
  if (prim) return prim;

  // auto → guess pointer-size
  if (t === "auto") return { size: ti.pointerSize, align: ti.pointerSize };

  // Check if it's a previously-computed record type
  const rec = recordMap.get(t);
  if (rec) return { size: rec.size, align: rec.alignment };

  // Unknown → treat as opaque 1-byte
  return { size: ti.pointerSize, align: ti.pointerSize };
}

/* ================================================================== */
/*  Compute layout for a single record                                 */
/* ================================================================== */

function computeLayout(
  parsed: ParsedRecord,
  ti: TargetInfo,
  recordMap: Map<string, StructLayout>
): StructLayout {
  const fields: FieldInfo[] = [];
  const bases: BaseClassInfo[] = [];

  let currentOffset = 0;
  let maxAlign = 1;
  let dataSize = 0;

  const effectiveAlign = (fieldAlign: number) =>
    parsed.isPacked ? 1 : fieldAlign;

  // ── vtable pointer ──
  if (parsed.hasVirtualMethod || parsed.bases.some((b) => b.isVirtual)) {
    const vAlign = effectiveAlign(ti.pointerSize);
    currentOffset = alignUp(currentOffset, vAlign);
    fields.push({
      name: "__vtable_ptr",
      type: "void**",
      offset: currentOffset,
      size: ti.pointerSize,
      alignment: vAlign,
      is_padding: false,
    });
    currentOffset += ti.pointerSize;
    dataSize = currentOffset;
    maxAlign = Math.max(maxAlign, vAlign);
  }

  // ── base classes ──
  for (const b of parsed.bases) {
    const baseLayout = recordMap.get(b.name);
    const baseSize = baseLayout?.size ?? ti.pointerSize;
    const baseAlign = baseLayout?.alignment ?? ti.pointerSize;
    const bAlign = effectiveAlign(baseAlign);

    currentOffset = alignUp(currentOffset, bAlign);
    bases.push({
      name: b.name,
      offset: currentOffset,
      size: baseSize,
      is_virtual: b.isVirtual,
    });
    currentOffset += baseSize;
    dataSize = currentOffset;
    maxAlign = Math.max(maxAlign, bAlign);
  }

  // ── fields ──
  let bitfieldOffset = 0; // bits consumed in current bitfield storage unit
  let bitfieldStorageEnd = 0; // byte offset where current storage unit ends
  let inBitfield = false;

  for (const f of parsed.fields) {
    if (f.bitWidth !== undefined) {
      // ── bitfield ──
      const storage = resolveType(f.typeStr, ti, recordMap);
      const storageBits = storage.size * 8;
      const fAlign = effectiveAlign(storage.align);

      if (
        !inBitfield ||
        bitfieldOffset + f.bitWidth > storageBits
      ) {
        // Start a new storage unit
        currentOffset = alignUp(currentOffset, fAlign);
        bitfieldOffset = 0;
        bitfieldStorageEnd = currentOffset + storage.size;
        inBitfield = true;
      }

      fields.push({
        name: f.name,
        type: f.typeStr,
        offset: currentOffset,
        size: Math.ceil(f.bitWidth / 8) || 1,
        alignment: fAlign,
        is_padding: false,
        bitfield: { width: f.bitWidth, offset: bitfieldOffset },
      });

      bitfieldOffset += f.bitWidth;
      maxAlign = Math.max(maxAlign, fAlign);

      // Only advance currentOffset if this is the last bitfield or
      // the next field is not a bitfield (handled below).
      continue;
    }

    // Close ongoing bitfield
    if (inBitfield) {
      currentOffset = bitfieldStorageEnd;
      inBitfield = false;
    }

    const metrics = resolveType(f.typeStr, ti, recordMap);
    let fieldSize = metrics.size;
    let fieldAlign = metrics.align;

    // Array
    if (f.arrayCount !== undefined && f.arrayCount > 0) {
      fieldSize = metrics.size * f.arrayCount;
      // alignment is element alignment
    }

    fieldAlign = effectiveAlign(fieldAlign);

    // Insert padding
    const aligned = alignUp(currentOffset, fieldAlign);
    if (aligned > currentOffset) {
      fields.push({
        name: `(padding)`,
        type: "(padding)",
        offset: currentOffset,
        size: aligned - currentOffset,
        alignment: 1,
        is_padding: true,
      });
    }
    currentOffset = aligned;

    fields.push({
      name: f.name,
      type: f.typeStr + (f.arrayCount !== undefined ? `[${f.arrayCount}]` : ""),
      offset: currentOffset,
      size: fieldSize,
      alignment: fieldAlign,
      is_padding: false,
    });

    currentOffset += fieldSize;
    dataSize = currentOffset;
    maxAlign = Math.max(maxAlign, fieldAlign);
  }

  // Close dangling bitfield
  if (inBitfield) {
    currentOffset = bitfieldStorageEnd;
    inBitfield = false;
  }

  // ── requested alignment (alignas) ──
  if (parsed.requestedAlignment) {
    maxAlign = Math.max(maxAlign, parsed.requestedAlignment);
  }

  // ── tail padding ──
  const totalSize = parsed.kind === "union"
    ? alignUp(Math.max(1, ...fields.map((f) => f.offset + f.size)), maxAlign)
    : alignUp(Math.max(currentOffset, 1), maxAlign);

  if (parsed.kind !== "union" && totalSize > currentOffset) {
    fields.push({
      name: "(tail padding)",
      type: "(padding)",
      offset: currentOffset,
      size: totalSize - currentOffset,
      alignment: 1,
      is_padding: true,
    });
  }

  if (dataSize === 0) dataSize = currentOffset;

  return {
    name: parsed.name,
    size: totalSize,
    alignment: maxAlign,
    data_size: dataSize,
    fields,
    bases,
    has_vtable:
      parsed.hasVirtualMethod || parsed.bases.some((b) => b.isVirtual),
    vtable_offset: parsed.hasVirtualMethod ? 0 : null,
  };
}

/* ================================================================== */
/*  Union layout                                                       */
/* ================================================================== */

function computeUnionLayout(
  parsed: ParsedRecord,
  ti: TargetInfo,
  recordMap: Map<string, StructLayout>
): StructLayout {
  const fields: FieldInfo[] = [];
  let maxSize = 0;
  let maxAlign = 1;

  for (const f of parsed.fields) {
    const metrics = resolveType(f.typeStr, ti, recordMap);
    let sz = metrics.size;
    if (f.arrayCount) sz *= f.arrayCount;
    const fAlign = parsed.isPacked ? 1 : metrics.align;

    fields.push({
      name: f.name,
      type: f.typeStr + (f.arrayCount ? `[${f.arrayCount}]` : ""),
      offset: 0,
      size: sz,
      alignment: fAlign,
      is_padding: false,
    });

    maxSize = Math.max(maxSize, sz);
    maxAlign = Math.max(maxAlign, fAlign);
  }

  if (parsed.requestedAlignment) {
    maxAlign = Math.max(maxAlign, parsed.requestedAlignment);
  }

  const totalSize = alignUp(Math.max(maxSize, 1), maxAlign);

  return {
    name: parsed.name,
    size: totalSize,
    alignment: maxAlign,
    data_size: maxSize,
    fields,
    bases: [],
    has_vtable: false,
    vtable_offset: null,
  };
}

/* ================================================================== */
/*  Public API                                                         */
/* ================================================================== */

export function analyzeLayout(
  records: ParsedRecord[],
  target: TargetPlatform
): StructLayout[] {
  const ti = targetInfo(target);
  const recordMap = new Map<string, StructLayout>();
  const results: StructLayout[] = [];

  for (const rec of records) {
    const layout =
      rec.kind === "union"
        ? computeUnionLayout(rec, ti, recordMap)
        : computeLayout(rec, ti, recordMap);
    recordMap.set(rec.name, layout);
    results.push(layout);
  }

  return results;
}
