import { useState, useCallback } from "react";

// ── Feature imports (via barrel index files) ──
import { CodeEditor } from "../features/editor";
import { analyzeCode, optimizeStructs } from "../features/analyzer";
import type { OptimizationResult } from "../features/analyzer";
import { runCppCode, DEFAULT_COMPILER, OutputPanel } from "../features/runner";
import type { RunResult } from "../features/runner";
import { StructLayoutView, StackFrameView, MemoryMapView, ComparisonView } from "../features/visualizer";

// ── Shared imports ──
import Toolbar from "../shared/ui/Toolbar";
import { EXAMPLES } from "../shared/constants/examples";
import type { AnalysisSettings, CompilerError, UnifiedResponse } from "../shared/types";
import { DEFAULT_CODE } from "../shared/types";
import { useUrlState } from "../shared/hooks/useUrlState";
import SplitPane from "../shared/ui/SplitPane";
import KeyboardShortcutsModal from "../shared/ui/KeyboardShortcutsModal";

type Tab = "layout" | "stack" | "pointers" | "compare";

export default function App() {
  const [appState, setAppState] = useUrlState({
    code: DEFAULT_CODE,
    target: "x86_64-linux-gnu" as AnalysisSettings["target"],
    compilerId: DEFAULT_COMPILER,
    themeId: "cppviz-night-owl"
  });

  const [settings, setSettings] = useState<AnalysisSettings>({
    target: appState.target,
    analysisTypes: ["layout", "stack", "pointers"],
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnifiedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("layout");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [optimizations, setOptimizations] = useState<OptimizationResult[] | null>(null);
  const [stdin, setStdin] = useState("");
  const [outputTab, setOutputTab] = useState<"stdout" | "stderr" | "compile" | "stdin">("stdout");

  // Sync settings target changes to appState so it gets persisted
  const handleSettingsChange = useCallback((newSettings: AnalysisSettings) => {
    setSettings(newSettings);
    setAppState({ target: newSettings.target });
  }, [setAppState]);

  // Collect all errors from all analyses for the editor
  const allErrors: CompilerError[] = [
    ...(result?.layout?.errors ?? []),
    ...(result?.stack?.errors ?? []),
    ...(result?.pointers?.errors ?? []),
  ];

  const handleAnalyze = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const data = analyzeCode(
        appState.code,
        settings.target,
        settings.analysisTypes
      );
      setResult(data);

      // Compute optimization suggestions for struct layout
      if (settings.analysisTypes.includes("layout")) {
        setOptimizations(optimizeStructs(appState.code, settings.target));
      } else {
        setOptimizations(null);
      }
      // Auto-switch to first available tab
      if (data.layout && settings.analysisTypes.includes("layout")) {
        setActiveTab("layout");
      } else if (data.stack && settings.analysisTypes.includes("stack")) {
        setActiveTab("stack");
      } else if (data.pointers && settings.analysisTypes.includes("pointers")) {
        setActiveTab("pointers");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appState.code, settings]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setShowOutput(true);
    setOutputTab("stdout");
    setRunResult(null);
    try {
      const result = await runCppCode(appState.code, appState.compilerId, stdin);
      setRunResult(result);
    } catch (err: unknown) {
      setRunResult({
        exitCode: -1,
        stdout: "",
        stderr: err instanceof Error ? err.message : "Failed to connect to Godbolt",
        compilationOutput: "",
        didNotRun: true,
      });
    } finally {
      setRunning(false);
    }
  }, [appState.code, appState.compilerId]);

  const tabs: { id: Tab; label: string; active: boolean }[] = [
    {
      id: "layout",
      label: "Struct Layout",
      active: settings.analysisTypes.includes("layout"),
    },
    {
      id: "stack",
      label: "Stack Frame",
      active: settings.analysisTypes.includes("stack"),
    },
    {
      id: "pointers",
      label: "Heap & Pointers",
      active: settings.analysisTypes.includes("pointers"),
    },
    {
      id: "compare",
      label: "Compare",
      active: settings.analysisTypes.includes("layout"),
    },
  ];

  const leftPane = (
    <>
      <div className="flex-1 min-h-0 custom-scrollbar">
        <CodeEditor
          value={appState.code}
          onChange={(code) => setAppState({ code })}
          errors={allErrors}
          onAnalyze={handleAnalyze}
          onRun={handleRun}
          theme={appState.themeId}
        />
      </div>
      {/* Stdin input (always visible if panel is open or user wants to pre-fill) */}
      {showOutput && (
        <OutputPanel
          result={runResult}
          running={running}
          onClose={() => setShowOutput(false)}
          stdin={stdin}
          onStdinChange={setStdin}
          activeTab={outputTab}
          onTabChange={setOutputTab}
        />
      )}
    </>
  );

  const rightPane = (
    <>
      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {tabs
          .filter((t) => t.active)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {error && (
          <div className="m-4 bg-red-900/40 border border-red-700/80 rounded-lg p-4 shadow-lg text-sm text-red-200">
            <h3 className="font-bold text-red-400 mb-1">Analysis Error</h3>
            <p>{error}</p>
          </div>
        )}

        {!result && !error && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none" />
            <div className="text-center space-y-4 max-w-sm z-10 p-8 border border-gray-700/50 rounded-2xl bg-gray-800/50 backdrop-blur-sm shadow-xl">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                <span className="text-3xl">📐</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-gray-300 mb-1">Ready to Analyze</h3>
                <p className="text-gray-400">Write or paste C++ code, then click <strong className="text-gray-300">Analyze</strong> to visualize memory layout.</p>
              </div>
              <div className="pt-2 flex flex-col gap-1 text-xs text-gray-500 font-mono">
                <p>Ctrl+Enter &rarr; Analyze</p>
                <p>Ctrl+Shift+Enter &rarr; Compile & Run</p>
              </div>
            </div>
          </div>
        )}

        {result && activeTab === "layout" && result.layout && (
          <StructLayoutView data={result.layout} optimizations={optimizations ?? undefined} />
        )}
        {result && activeTab === "stack" && result.stack && (
          <StackFrameView data={result.stack} />
        )}
        {result && activeTab === "pointers" && result.pointers && (
          <MemoryMapView data={result.pointers} />
        )}
        {activeTab === "compare" && (
          <ComparisonView code={appState.code} />
        )}
      </div>
    </>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-300 overflow-hidden font-sans">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-lg">C</div>
          <h1 className="text-lg font-bold font-display text-white tracking-tight">
            CppViz
          </h1>
          <span className="text-xs text-gray-500 hidden sm:inline ml-2">
            Fully client-side memory layout visualizer
          </span>
        </div>
        <div className="flex items-center gap-2">
        <select
          className="bg-gray-750 text-gray-300 text-sm rounded-md px-3 py-1.5 border border-gray-650 hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner"
          value=""
          onChange={(e) => {
            const ex = EXAMPLES.find((x) => x.name === e.target.value);
            if (ex) setAppState({ code: ex.code });
          }}
        >
          <option value="" disabled>
            Load example…
          </option>
          {EXAMPLES.map((ex) => (
            <option key={ex.name} value={ex.name}>
              {ex.name}
            </option>
          ))}
          </select>
          <KeyboardShortcutsModal />
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onAnalyze={handleAnalyze}
        onRun={handleRun}
        loading={loading}
        running={running}
        compilerId={appState.compilerId}
        onCompilerChange={(c) => setAppState({ compilerId: c })}
        themeId={appState.themeId}
        onThemeChange={(t) => setAppState({ themeId: t })}
        onOpenStdin={() => {
          setShowOutput(true);
          setOutputTab("stdin");
        }}
        hasStdin={stdin.length > 0}
      />

      {/* Main Panes with SplitPane */}
      <SplitPane left={leftPane} right={rightPane} initialLeftWidthPercent={50} />

      {/* Footer */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-gray-800 border-t border-gray-700 text-[11px] text-gray-500 flex-shrink-0">
        <span>CppViz v2.0 — Built with React + TypeScript</span>
        <a
          href="https://github.com/mahtab04/cppviz-web"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-300 transition-colors"
        >
          GitHub ↗
        </a>
      </footer>
    </div>
  );
}
