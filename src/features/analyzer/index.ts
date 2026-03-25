/**
 * Analyzer feature — public API barrel.
 *
 * Re-exports everything consumers need so they can import from
 * `@features/analyzer` (or `../features/analyzer`) without reaching
 * into internal sub-folders.
 */

export { analyze, analyze as analyzeCode } from "./api";
export { parseRecords, stripComments } from "./parser/parser";
export type { ParsedRecord, ParsedField, ParsedBase } from "./parser/parser";
export { analyzeLayout } from "./engine/layout-engine";
export { analyzeStack } from "./engine/stack-analyzer";
export { analyzePointers } from "./engine/pointer-analyzer";
export { optimizeStructs } from "./engine/optimizer";
export type { OptimizationResult } from "./engine/optimizer";
