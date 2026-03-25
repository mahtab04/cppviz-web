import { useState, useRef, useEffect, useMemo } from "react";
import type { RunResult } from "../services/godbolt";

interface OutputPanelProps {
  result: RunResult | null;
  running: boolean;
  onClose: () => void;
}

/** Classify a single compiler-output line. */
function lineClass(line: string): string {
  if (/\berror[:\s]/i.test(line)) return "text-red-400";
  if (/\bwarning[:\s]/i.test(line)) return "text-yellow-400";
  if (/\bnote[:\s]/i.test(line)) return "text-blue-400";
  if (/^\s*\^/.test(line) || /^\s*~/.test(line)) return "text-red-300"; // caret / squiggle lines
  return "text-gray-300";
}

export default function OutputPanel({
  result,
  running,
  onClose,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr" | "compile">(
    "stdout"
  );
  const scrollRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result]);

  // Auto-switch to stderr if there was no stdout but there is stderr
  useEffect(() => {
    if (result) {
      if (result.didNotRun) {
        setActiveTab("compile");
      } else if (!result.stdout && result.stderr) {
        setActiveTab("stderr");
      } else {
        setActiveTab("stdout");
      }
    }
  }, [result]);

  /** Count errors / warnings in compiler output for badge. */
  const diagnosticCounts = useMemo(() => {
    const txt = result?.compilationOutput ?? "";
    const errors = (txt.match(/\berror[:\s]/gi) ?? []).length;
    const warnings = (txt.match(/\bwarning[:\s]/gi) ?? []).length;
    return { errors, warnings };
  }, [result?.compilationOutput]);

  const tabs = [
    { id: "stdout" as const, label: "Output", hasContent: !!result?.stdout },
    { id: "stderr" as const, label: "Stderr", hasContent: !!result?.stderr },
    {
      id: "compile" as const,
      label: "Compiler",
      hasContent: !!result?.compilationOutput,
    },
  ];

  const content =
    activeTab === "stdout"
      ? result?.stdout ?? ""
      : activeTab === "stderr"
        ? result?.stderr ?? ""
        : result?.compilationOutput ?? "";

  return (
    <div className="flex flex-col border-t border-gray-700 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-t transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
              {tab.hasContent && tab.id === "compile" && diagnosticCounts.errors > 0 ? (
                <span className="ml-1 text-[10px] font-bold bg-red-600 text-white rounded px-1">
                  {diagnosticCounts.errors}
                </span>
              ) : tab.hasContent && tab.id === "compile" && diagnosticCounts.warnings > 0 ? (
                <span className="ml-1 text-[10px] font-bold bg-yellow-600 text-white rounded px-1">
                  {diagnosticCounts.warnings}
                </span>
              ) : tab.hasContent ? (
                <span
                  className={`ml-1 inline-block w-1.5 h-1.5 rounded-full ${
                    tab.id === "stderr" || tab.id === "compile"
                      ? "bg-yellow-400"
                      : "bg-green-400"
                  }`}
                />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {result && !result.didNotRun && (
            <span
              className={`text-xs font-mono ${
                result.exitCode === 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              exit: {result.exitCode}
            </span>
          )}
          {result?.didNotRun && (
            <span className="text-xs text-red-400 font-medium">
              Compilation failed
            </span>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xs px-1"
            title="Close output"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Error banner */}
      {result?.didNotRun && activeTab !== "compile" && (
        <button
          onClick={() => setActiveTab("compile")}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-900/60 border-b border-red-700 text-red-200 text-xs hover:bg-red-900/80 transition-colors cursor-pointer w-full text-left"
        >
          <span className="font-bold">✕ Compilation failed</span>
          <span className="text-red-400">— click here or the Compiler tab to see errors</span>
        </button>
      )}

      {/* Content */}
      <pre
        ref={scrollRef}
        className="flex-1 p-3 text-sm font-mono text-gray-200 overflow-auto min-h-[100px] max-h-[220px] whitespace-pre-wrap"
      >
        {running ? (
          <span className="text-gray-500 animate-pulse">
            Compiling and running on Godbolt…
          </span>
        ) : content && activeTab === "compile" ? (
          // Colour-code compiler output line-by-line
          content.split("\n").map((line, i) => (
            <span key={i} className={lineClass(line)}>
              {line}\n
            </span>
          ))
        ) : content ? (
          content
        ) : result ? (
          <span className="text-gray-600">(no output)</span>
        ) : (
          <span className="text-gray-600">
            Click ▶ Run to execute your C++ code
          </span>
        )}
      </pre>
    </div>
  );
}
