/**
 * C++ language intelligence for Monaco Editor:
 * - Keyword & STL type completions
 * - Code snippets (struct, class, for, etc.)
 * - Common header completions for #include
 */
import type { IDisposable } from "monaco-editor";

// ── Keyword completions ──

const CPP_KEYWORDS = [
  "alignas", "alignof", "auto", "bool", "break", "case", "catch", "char",
  "char8_t", "char16_t", "char32_t", "class", "concept", "const",
  "consteval", "constexpr", "constinit", "const_cast", "continue",
  "co_await", "co_return", "co_yield", "decltype", "default", "delete",
  "do", "double", "dynamic_cast", "else", "enum", "explicit", "export",
  "extern", "false", "float", "for", "friend", "goto", "if", "inline",
  "int", "long", "mutable", "namespace", "new", "noexcept", "nullptr",
  "operator", "private", "protected", "public", "register",
  "reinterpret_cast", "requires", "return", "short", "signed", "sizeof",
  "static", "static_assert", "static_cast", "struct", "switch",
  "template", "this", "thread_local", "throw", "true", "try", "typedef",
  "typeid", "typename", "union", "unsigned", "using", "virtual", "void",
  "volatile", "wchar_t", "while",
];

const STL_TYPES = [
  "string", "wstring", "string_view",
  "vector", "array", "deque", "list", "forward_list",
  "map", "unordered_map", "multimap", "unordered_multimap",
  "set", "unordered_set", "multiset", "unordered_multiset",
  "stack", "queue", "priority_queue",
  "pair", "tuple", "optional", "variant", "any",
  "unique_ptr", "shared_ptr", "weak_ptr",
  "function", "bind",
  "thread", "mutex", "lock_guard", "unique_lock",
  "atomic", "future", "promise",
  "cout", "cin", "cerr", "endl",
  "size_t", "ptrdiff_t", "int8_t", "int16_t", "int32_t", "int64_t",
  "uint8_t", "uint16_t", "uint32_t", "uint64_t",
  "span", "expected", "format",
];

const COMMON_HEADERS = [
  "iostream", "string", "vector", "array", "map", "unordered_map",
  "set", "unordered_set", "algorithm", "numeric", "functional",
  "memory", "cstdlib", "cstdio", "cstring", "cmath",
  "tuple", "optional", "variant", "any", "utility",
  "thread", "mutex", "atomic", "future", "chrono",
  "fstream", "sstream", "iomanip", "cassert", "stdexcept",
  "type_traits", "concepts", "ranges", "format", "span",
  "deque", "list", "forward_list", "stack", "queue",
  "bitset", "complex", "random", "regex", "filesystem",
  "initializer_list", "limits", "cstdint",
];

// ── Snippet definitions ──

interface SnippetDef {
  label: string;
  insertText: string;
  detail: string;
  documentation: string;
}

const SNIPPETS: SnippetDef[] = [
  {
    label: "struct",
    insertText: [
      "struct ${1:Name} {",
      "\t${2:// members}",
      "};",
    ].join("\n"),
    detail: "Struct definition",
    documentation: "Creates a new struct with members.",
  },
  {
    label: "class",
    insertText: [
      "class ${1:Name} {",
      "public:",
      "\t${1:Name}() = default;",
      "\t~${1:Name}() = default;",
      "",
      "private:",
      "\t${2:// members}",
      "};",
    ].join("\n"),
    detail: "Class definition",
    documentation: "Creates a new class with constructor, destructor, and private section.",
  },
  {
    label: "for",
    insertText: [
      "for (${1:int} ${2:i} = ${3:0}; ${2:i} < ${4:n}; ++${2:i}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "For loop",
    documentation: "Standard indexed for loop.",
  },
  {
    label: "forr",
    insertText: [
      "for (const auto& ${1:item} : ${2:container}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "Range-based for loop",
    documentation: "C++11 range-based for loop.",
  },
  {
    label: "if",
    insertText: [
      "if (${1:condition}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "If statement",
    documentation: "Standard if block.",
  },
  {
    label: "ifelse",
    insertText: [
      "if (${1:condition}) {",
      "\t$2",
      "} else {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "If-else statement",
    documentation: "If with else block.",
  },
  {
    label: "while",
    insertText: [
      "while (${1:condition}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "While loop",
    documentation: "Standard while loop.",
  },
  {
    label: "main",
    insertText: [
      "int main() {",
      "\t$0",
      "\treturn 0;",
      "}",
    ].join("\n"),
    detail: "Main function",
    documentation: "C++ main entry point.",
  },
  {
    label: "mainio",
    insertText: [
      "#include <iostream>",
      "",
      "int main() {",
      "\tstd::cout << ${1:\"Hello, World!\"} << std::endl;",
      "\treturn 0;",
      "}",
    ].join("\n"),
    detail: "Main with iostream",
    documentation: "Hello world starter template.",
  },
  {
    label: "cout",
    insertText: "std::cout << ${1:value} << std::endl;",
    detail: "std::cout",
    documentation: "Print to stdout with std::cout.",
  },
  {
    label: "cin",
    insertText: "std::cin >> ${1:variable};",
    detail: "std::cin",
    documentation: "Read from stdin.",
  },
  {
    label: "template",
    insertText: [
      "template <typename ${1:T}>",
      "${2:void} ${3:func}(${4:const T& value}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "Function template",
    documentation: "Template function with a type parameter.",
  },
  {
    label: "#include",
    insertText: "#include <${1:header}>",
    detail: "#include <header>",
    documentation: "Include a standard header.",
  },
  {
    label: "enum class",
    insertText: [
      "enum class ${1:Name} {",
      "\t${2:Value1},",
      "\t${3:Value2},",
      "};",
    ].join("\n"),
    detail: "Scoped enum",
    documentation: "C++11 scoped enumeration.",
  },
  {
    label: "lambda",
    insertText: "[${1:&}](${2:auto param}) { $0 }",
    detail: "Lambda expression",
    documentation: "C++ lambda.",
  },
  {
    label: "unique_ptr",
    insertText: "auto ${1:ptr} = std::make_unique<${2:Type}>(${3:args});",
    detail: "std::unique_ptr",
    documentation: "Create a unique_ptr with make_unique.",
  },
  {
    label: "shared_ptr",
    insertText: "auto ${1:ptr} = std::make_shared<${2:Type}>(${3:args});",
    detail: "std::shared_ptr",
    documentation: "Create a shared_ptr with make_shared.",
  },
  {
    label: "switch",
    insertText: [
      "switch (${1:expr}) {",
      "\tcase ${2:value1}:",
      "\t\t$0",
      "\t\tbreak;",
      "\tdefault:",
      "\t\tbreak;",
      "}",
    ].join("\n"),
    detail: "Switch statement",
    documentation: "Switch-case block.",
  },
  {
    label: "try",
    insertText: [
      "try {",
      "\t$1",
      "} catch (const ${2:std::exception}& ${3:e}) {",
      "\t$0",
      "}",
    ].join("\n"),
    detail: "Try-catch block",
    documentation: "Exception handling.",
  },
];

/**
 * Register C++ autocompletion and snippets in Monaco.
 * Returns disposables that should be cleaned up when unmounting.
 */
export function registerCppLanguageFeatures(
  monaco: typeof import("monaco-editor")
): IDisposable[] {
  const disposables: IDisposable[] = [];

  // 1) Completion provider (keywords + STL + snippets + headers)
  disposables.push(
    monaco.languages.registerCompletionItemProvider("cpp", {
      triggerCharacters: [".", ":", "<", "#"],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Check if we're in a #include context
        const lineContent = model.getLineContent(position.lineNumber);
        const isIncludeLine = /^\s*#\s*include\s*</.test(lineContent);

        const suggestions: any[] = [];

        if (isIncludeLine) {
          // Suggest header names
          for (const h of COMMON_HEADERS) {
            suggestions.push({
              label: h,
              kind: monaco.languages.CompletionItemKind.File,
              insertText: h,
              range,
              detail: `<${h}>`,
              sortText: `0_${h}`,
            });
          }
          return { suggestions };
        }

        // Keywords
        for (const kw of CPP_KEYWORDS) {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
            sortText: `2_${kw}`,
          });
        }

        // STL types
        for (const t of STL_TYPES) {
          suggestions.push({
            label: t,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: t,
            range,
            detail: "std:: type",
            sortText: `1_${t}`,
          });
        }

        // Snippets
        for (const s of SNIPPETS) {
          suggestions.push({
            label: s.label,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: s.detail,
            documentation: s.documentation,
            sortText: `0_${s.label}`,
          });
        }

        return { suggestions };
      },
    })
  );

  return disposables;
}
