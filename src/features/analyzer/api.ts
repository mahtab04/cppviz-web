/**
 * Unified in-browser C++ memory analyser.
 *
 * Replaces the server-side C++ analyzer + Express gateway with a
 * pure TypeScript implementation that runs entirely in the browser.
 */

import type {
  AnalysisType,
  TargetPlatform,
  UnifiedResponse,
  LayoutResponse,
  StackResponse,
  PointerResponse,
} from "../../shared/types";
import { parseRecords } from "./parser/parser";
import { analyzeLayout } from "./engine/layout-engine";
import { analyzeStack } from "./engine/stack-analyzer";
import { analyzePointers } from "./engine/pointer-analyzer";

export function analyze(
  code: string,
  target: TargetPlatform,
  analysisTypes: AnalysisType[]
): UnifiedResponse {
  const result: UnifiedResponse = {};

  if (analysisTypes.includes("layout")) {
    const records = parseRecords(code);
    const structs = analyzeLayout(records, target);
    const layout: LayoutResponse = { structs, errors: [] };
    result.layout = layout;
  }

  if (analysisTypes.includes("stack")) {
    const functions = analyzeStack(code, target);
    const stack: StackResponse = { functions, errors: [] };
    result.stack = stack;
  }

  if (analysisTypes.includes("pointers")) {
    const { allocations, relations } = analyzePointers(code, target);
    const pointers: PointerResponse = { allocations, relations, errors: [] };
    result.pointers = pointers;
  }

  return result;
}
