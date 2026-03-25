/**
 * Custom Monaco Editor themes for CppViz.
 *
 * Each theme is a Monaco IStandaloneThemeData object.
 * Register with: monaco.editor.defineTheme(name, themeData)
 */

export interface CppVizTheme {
  id: string;
  label: string;
  data: {
    base: "vs" | "vs-dark" | "hc-black";
    inherit: boolean;
    rules: Array<{ token: string; foreground?: string; fontStyle?: string }>;
    colors: Record<string, string>;
  };
}

// ── Night Owl (inspired) ──
const nightOwl: CppVizTheme = {
  id: "cppviz-night-owl",
  label: "Night Owl",
  data: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment",            foreground: "637777", fontStyle: "italic" },
      { token: "keyword",            foreground: "c792ea", fontStyle: "italic" },
      { token: "keyword.control",    foreground: "c792ea", fontStyle: "italic" },
      { token: "keyword.operator",   foreground: "7fdbca" },
      { token: "string",             foreground: "ecc48d" },
      { token: "string.escape",      foreground: "f78c6c" },
      { token: "number",             foreground: "f78c6c" },
      { token: "number.hex",         foreground: "f78c6c" },
      { token: "type",               foreground: "ffcb8b" },
      { token: "type.identifier",    foreground: "ffcb8b" },
      { token: "identifier",         foreground: "d6deeb" },
      { token: "function",           foreground: "82aaff" },
      { token: "delimiter",          foreground: "7fdbca" },
      { token: "delimiter.bracket",  foreground: "d6deeb" },
      { token: "operator",           foreground: "7fdbca" },
      { token: "preprocessor",       foreground: "c792ea" },
      { token: "annotation",         foreground: "f78c6c" },
      { token: "constant",           foreground: "82aaff" },
    ],
    colors: {
      "editor.background":                "#011627",
      "editor.foreground":                "#d6deeb",
      "editor.lineHighlightBackground":   "#010e1a",
      "editor.selectionBackground":       "#1d3b53",
      "editor.inactiveSelectionBackground":"#1d3b5388",
      "editorCursor.foreground":          "#80a4c2",
      "editorWhitespace.foreground":      "#1e3a5f",
      "editor.findMatchBackground":       "#5f7e971a",
      "editor.findMatchHighlightBackground":"#1a8553a6",
      "editorLineNumber.foreground":      "#4b6479",
      "editorLineNumber.activeForeground":"#c5e4fd",
      "editorIndentGuide.background":     "#1e3a5f",
      "editorIndentGuide.activeBackground":"#7e57c2",
      "editorBracketMatch.background":    "#1d3b53",
      "editorBracketMatch.border":        "#5f7e97",
      "editorGutter.background":          "#011627",
      "editorOverviewRuler.border":       "#011627",
      "scrollbar.shadow":                 "#010e1a",
      "editorWidget.background":          "#0b2942",
      "editorSuggestWidget.background":   "#0b2942",
      "editorSuggestWidget.border":       "#1e3a5f",
      "editorSuggestWidget.selectedBackground": "#1d3b53",
      "editorHoverWidget.background":     "#0b2942",
      "editorHoverWidget.border":         "#1e3a5f",
    },
  },
};

// ── GitHub Dark (inspired) ──
const githubDark: CppVizTheme = {
  id: "cppviz-github-dark",
  label: "GitHub Dark",
  data: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment",            foreground: "8b949e", fontStyle: "italic" },
      { token: "keyword",            foreground: "ff7b72" },
      { token: "keyword.control",    foreground: "ff7b72" },
      { token: "string",             foreground: "a5d6ff" },
      { token: "number",             foreground: "79c0ff" },
      { token: "type",               foreground: "ffa657" },
      { token: "type.identifier",    foreground: "ffa657" },
      { token: "identifier",         foreground: "c9d1d9" },
      { token: "function",           foreground: "d2a8ff" },
      { token: "delimiter",          foreground: "c9d1d9" },
      { token: "operator",           foreground: "ff7b72" },
      { token: "preprocessor",       foreground: "ff7b72" },
      { token: "constant",           foreground: "79c0ff" },
    ],
    colors: {
      "editor.background":                "#0d1117",
      "editor.foreground":                "#c9d1d9",
      "editor.lineHighlightBackground":   "#161b22",
      "editor.selectionBackground":       "#264f78",
      "editorCursor.foreground":          "#58a6ff",
      "editorWhitespace.foreground":      "#21262d",
      "editorLineNumber.foreground":      "#484f58",
      "editorLineNumber.activeForeground":"#c9d1d9",
      "editorIndentGuide.background":     "#21262d",
      "editorIndentGuide.activeBackground":"#58a6ff",
      "editorBracketMatch.background":    "#264f7888",
      "editorBracketMatch.border":        "#58a6ff",
      "editorGutter.background":          "#0d1117",
      "editorWidget.background":          "#161b22",
      "editorSuggestWidget.background":   "#161b22",
      "editorSuggestWidget.border":       "#30363d",
      "editorSuggestWidget.selectedBackground": "#264f78",
      "editorHoverWidget.background":     "#161b22",
      "editorHoverWidget.border":         "#30363d",
    },
  },
};

// ── Monokai Pro (inspired) ──
const monokaiPro: CppVizTheme = {
  id: "cppviz-monokai",
  label: "Monokai Pro",
  data: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment",            foreground: "727072", fontStyle: "italic" },
      { token: "keyword",            foreground: "ff6188" },
      { token: "keyword.control",    foreground: "ff6188" },
      { token: "string",             foreground: "ffd866" },
      { token: "number",             foreground: "ab9df2" },
      { token: "type",               foreground: "78dce8" },
      { token: "type.identifier",    foreground: "a9dc76" },
      { token: "identifier",         foreground: "fcfcfa" },
      { token: "function",           foreground: "a9dc76" },
      { token: "delimiter",          foreground: "939293" },
      { token: "operator",           foreground: "ff6188" },
      { token: "preprocessor",       foreground: "ff6188" },
      { token: "constant",           foreground: "ab9df2" },
    ],
    colors: {
      "editor.background":                "#2d2a2e",
      "editor.foreground":                "#fcfcfa",
      "editor.lineHighlightBackground":   "#363337",
      "editor.selectionBackground":       "#403e41",
      "editorCursor.foreground":          "#fcfcfa",
      "editorWhitespace.foreground":      "#403e41",
      "editorLineNumber.foreground":      "#5b595c",
      "editorLineNumber.activeForeground":"#c1c0c0",
      "editorIndentGuide.background":     "#403e41",
      "editorIndentGuide.activeBackground":"#ff6188",
      "editorBracketMatch.background":    "#403e4188",
      "editorBracketMatch.border":        "#ffd866",
      "editorGutter.background":          "#2d2a2e",
      "editorWidget.background":          "#363337",
      "editorSuggestWidget.background":   "#363337",
      "editorSuggestWidget.border":       "#403e41",
      "editorSuggestWidget.selectedBackground": "#403e41",
      "editorHoverWidget.background":     "#363337",
      "editorHoverWidget.border":         "#403e41",
    },
  },
};

// ── Dracula (inspired) ──
const dracula: CppVizTheme = {
  id: "cppviz-dracula",
  label: "Dracula",
  data: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment",            foreground: "6272a4", fontStyle: "italic" },
      { token: "keyword",            foreground: "ff79c6", fontStyle: "italic" },
      { token: "keyword.control",    foreground: "ff79c6" },
      { token: "string",             foreground: "f1fa8c" },
      { token: "number",             foreground: "bd93f9" },
      { token: "type",               foreground: "8be9fd", fontStyle: "italic" },
      { token: "type.identifier",    foreground: "8be9fd" },
      { token: "identifier",         foreground: "f8f8f2" },
      { token: "function",           foreground: "50fa7b" },
      { token: "delimiter",          foreground: "f8f8f2" },
      { token: "operator",           foreground: "ff79c6" },
      { token: "preprocessor",       foreground: "ff79c6" },
      { token: "constant",           foreground: "bd93f9" },
    ],
    colors: {
      "editor.background":                "#282a36",
      "editor.foreground":                "#f8f8f2",
      "editor.lineHighlightBackground":   "#44475a",
      "editor.selectionBackground":       "#44475a",
      "editorCursor.foreground":          "#f8f8f2",
      "editorWhitespace.foreground":      "#3b3d50",
      "editorLineNumber.foreground":      "#6272a4",
      "editorLineNumber.activeForeground":"#f8f8f2",
      "editorIndentGuide.background":     "#3b3d50",
      "editorIndentGuide.activeBackground":"#bd93f9",
      "editorBracketMatch.background":    "#44475a88",
      "editorBracketMatch.border":        "#ff79c6",
      "editorGutter.background":          "#282a36",
      "editorWidget.background":          "#21222c",
      "editorSuggestWidget.background":   "#21222c",
      "editorSuggestWidget.border":       "#44475a",
      "editorSuggestWidget.selectedBackground": "#44475a",
      "editorHoverWidget.background":     "#21222c",
      "editorHoverWidget.border":         "#44475a",
    },
  },
};

// ── One Dark Pro (inspired) ──
const oneDarkPro: CppVizTheme = {
  id: "cppviz-one-dark",
  label: "One Dark Pro",
  data: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment",            foreground: "5c6370", fontStyle: "italic" },
      { token: "keyword",            foreground: "c678dd" },
      { token: "keyword.control",    foreground: "c678dd" },
      { token: "string",             foreground: "98c379" },
      { token: "number",             foreground: "d19a66" },
      { token: "type",               foreground: "e5c07b" },
      { token: "type.identifier",    foreground: "e5c07b" },
      { token: "identifier",         foreground: "abb2bf" },
      { token: "function",           foreground: "61afef" },
      { token: "delimiter",          foreground: "abb2bf" },
      { token: "operator",           foreground: "56b6c2" },
      { token: "preprocessor",       foreground: "c678dd" },
      { token: "constant",           foreground: "d19a66" },
    ],
    colors: {
      "editor.background":                "#282c34",
      "editor.foreground":                "#abb2bf",
      "editor.lineHighlightBackground":   "#2c313c",
      "editor.selectionBackground":       "#3e4451",
      "editorCursor.foreground":          "#528bff",
      "editorWhitespace.foreground":      "#3b4048",
      "editorLineNumber.foreground":      "#495162",
      "editorLineNumber.activeForeground":"#abb2bf",
      "editorIndentGuide.background":     "#3b4048",
      "editorIndentGuide.activeBackground":"#c678dd",
      "editorBracketMatch.background":    "#3e445188",
      "editorBracketMatch.border":        "#528bff",
      "editorGutter.background":          "#282c34",
      "editorWidget.background":          "#21252b",
      "editorSuggestWidget.background":   "#21252b",
      "editorSuggestWidget.border":       "#3e4451",
      "editorSuggestWidget.selectedBackground": "#2c313c",
      "editorHoverWidget.background":     "#21252b",
      "editorHoverWidget.border":         "#3e4451",
    },
  },
};

/** All available themes. */
export const THEMES: CppVizTheme[] = [
  nightOwl,
  githubDark,
  monokaiPro,
  dracula,
  oneDarkPro,
];

/** Built-in Monaco themes the user can also pick. */
export const BUILTIN_THEMES = [
  { id: "vs-dark", label: "VS Dark" },
  { id: "vs", label: "VS Light" },
  { id: "hc-black", label: "High Contrast" },
];

/**
 * Register all custom themes with Monaco.
 * Call once after Monaco is loaded.
 */
export function registerAllThemes(monaco: typeof import("monaco-editor")) {
  for (const theme of THEMES) {
    monaco.editor.defineTheme(theme.id, theme.data as any);
  }
}
