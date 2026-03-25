/* ── Shared types matching the analyzer API schema ── */

export type TargetPlatform =
  | "x86_64-linux-gnu"
  | "i386-linux-gnu"
  | "x86_64-pc-windows-msvc"
  | "i386-pc-windows-msvc";

export type AnalysisType = "layout" | "stack" | "pointers";

// ── Struct Layout ──

export interface BitfieldInfo {
  width: number;
  offset: number;
}

export interface FieldInfo {
  name: string;
  type: string;
  offset: number;
  size: number;
  alignment: number;
  is_padding: boolean;
  bitfield?: BitfieldInfo | null;
}

export interface BaseClassInfo {
  name: string;
  offset: number;
  size: number;
  is_virtual: boolean;
}

export interface StructLayout {
  name: string;
  size: number;
  alignment: number;
  data_size: number;
  fields: FieldInfo[];
  bases: BaseClassInfo[];
  has_vtable: boolean;
  vtable_offset?: number | null;
}

// ── Stack Frame ──

export interface StackVariable {
  name: string;
  type: string;
  offset: number;
  size: number;
  is_pointer: boolean;
  points_to?: string | null;
}

export interface FunctionInfo {
  name: string;
  stack_frame: StackVariable[];
  total_stack_size: number;
}

// ── Heap / Pointers ──

export interface HeapAllocation {
  id: string;
  type: string;
  size: number;
  source_line: number;
}

export interface PointerRelation {
  from_variable: string;
  to_allocation_id?: string | null;
  to_variable?: string | null;
  relation_type: "owns" | "references";
}

// ── Compiler Errors ──

export interface CompilerError {
  line: number;
  column: number;
  message: string;
  severity: string;
}

// ── Responses ──

export interface LayoutResponse {
  structs: StructLayout[];
  errors: CompilerError[];
}

export interface StackResponse {
  functions: FunctionInfo[];
  errors: CompilerError[];
}

export interface PointerResponse {
  allocations: HeapAllocation[];
  relations: PointerRelation[];
  errors: CompilerError[];
}

export interface UnifiedResponse {
  layout?: LayoutResponse | null;
  stack?: StackResponse | null;
  pointers?: PointerResponse | null;
}

// ── UI State ──

export interface AnalysisSettings {
  target: TargetPlatform;
  analysisTypes: AnalysisType[];
}

export const TARGET_LABELS: Record<TargetPlatform, string> = {
  "x86_64-linux-gnu": "x86-64 Linux",
  "i386-linux-gnu": "x86 (32-bit) Linux",
  "x86_64-pc-windows-msvc": "x86-64 MSVC",
  "i386-pc-windows-msvc": "x86 (32-bit) MSVC",
};

export const DEFAULT_CODE = `// Try pasting your C++ structs and classes here!
struct Example {
    char a;
    double b;
    int c;
    char d;
};

class Widget {
    int id;
    bool active;
    double value;
    char label[8];
};

void demo() {
    int x = 42;
    double y = 3.14;
    int* p = new int(10);
    Example ex;
    delete p;
}
`;
