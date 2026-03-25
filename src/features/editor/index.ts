/**
 * Editor feature — public API barrel.
 */

export { default as CodeEditor } from "./components/CodeEditor";
export { registerCppLanguageFeatures } from "./config/cpp-language";
export { registerAllThemes, THEMES, BUILTIN_THEMES } from "./config/themes";
export type { CppVizTheme } from "./config/themes";
