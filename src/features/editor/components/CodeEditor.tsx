import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { CompilerError } from "../../../shared/types";
import { registerCppLanguageFeatures } from "../config/cpp-language";
import { registerAllThemes } from "../config/themes";
import type { IDisposable } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: CompilerError[];
  /** Ctrl+Enter */
  onAnalyze?: () => void;
  /** Ctrl+Shift+Enter */
  onRun?: () => void;
  /** Monaco theme id */
  theme?: string;
}

export default function CodeEditor({
  value,
  onChange,
  errors = [],
  onAnalyze,
  onRun,
  theme = "cppviz-night-owl",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const langDisposablesRef = useRef<IDisposable[]>([]);
  const decorationsRef = useRef<string[]>([]);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // ── Register custom themes (once) ──
      registerAllThemes(monaco);
      monaco.editor.setTheme(theme);

      // ── Register C++ autocomplete & snippets (once) ──
      if (langDisposablesRef.current.length === 0) {
        langDisposablesRef.current = registerCppLanguageFeatures(monaco);
      }

      // ── Keyboard shortcuts ──
      // Ctrl+Enter → Analyze
      editor.addAction({
        id: "cppviz-analyze",
        label: "Analyze Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => onAnalyze?.(),
      });

      // Ctrl+Shift+Enter → Run
      editor.addAction({
        id: "cppviz-run",
        label: "Run Code",
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
        ],
        run: () => onRun?.(),
      });

    },
    [onAnalyze, onRun, theme]
  );

  // ── Switch theme dynamically ──
  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco) {
      monaco.editor.setTheme(theme);
    }
  }, [theme]);

  // ── Error markers + inline hints + line highlighting ──
  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;
    const model = editor.getModel();
    if (!model) return;

    // Squiggly underline markers
    const markers = errors.map((err) => ({
      severity:
        err.severity === "error"
          ? monaco.MarkerSeverity.Error
          : err.severity === "warning"
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info,
      startLineNumber: err.line,
      startColumn: err.column || 1,
      endLineNumber: err.line,
      endColumn: (err.column || 1) + 20,
      message: err.message,
    }));
    monaco.editor.setModelMarkers(model, "clang", markers);

    // Inline hint decorations + line background highlight
    const newDecorations = errors.flatMap((err) => {
      const isErr = err.severity === "error";
      const decs: any[] = [];

      // Background tint on the whole line
      decs.push({
        range: new monaco.Range(err.line, 1, err.line, 1),
        options: {
          isWholeLine: true,
          className: isErr
            ? "cppviz-error-line"
            : "cppviz-warning-line",
          overviewRuler: {
            color: isErr ? "#ef4444" : "#eab308",
            position: monaco.editor.OverviewRulerLane.Full,
          },
        },
      });

      // Inline message after the line
      decs.push({
        range: new monaco.Range(err.line, 1, err.line, 1),
        options: {
          isWholeLine: true,
          after: {
            content: `  ← ${err.severity}: ${err.message}`,
            inlineClassName: isErr
              ? "cppviz-error-inline"
              : "cppviz-warning-inline",
          },
        },
      });

      return decs;
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [errors]);

  // Cleanup language disposables on unmount
  useEffect(() => {
    return () => {
      langDisposablesRef.current.forEach((d) => d.dispose());
      langDisposablesRef.current = [];
    };
  }, []);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-700">
      <Editor
        height="100%"
        defaultLanguage="cpp"
        theme={theme}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12 },
          lineNumbersMinChars: 3,
          glyphMargin: true,
          folding: true,
          automaticLayout: true,
          // Bracket pair colorization
          bracketPairColorization: { enabled: true, independentColorPoolPerBracketType: true },
          guides: { bracketPairs: true, bracketPairsHorizontal: true, indentation: true },
          // Auto-format on paste
          formatOnPaste: true,
          // Better autocomplete experience
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, strings: false, comments: false },
          acceptSuggestionOnCommitCharacter: true,
          tabCompletion: "on",
          snippetSuggestions: "top",
          // Smooth editing
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,
          renderWhitespace: "selection",
          matchBrackets: "always",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoSurround: "languageDefined",
        }}
      />
    </div>
  );
}
