import type {
  AnalysisType,
  TargetPlatform,
  AnalysisSettings,
} from "../types";
import { TARGET_LABELS } from "../types";
import { COMPILERS } from "../../features/runner";
import { THEMES, BUILTIN_THEMES } from "../../features/editor";

interface ToolbarProps {
  settings: AnalysisSettings;
  onSettingsChange: (s: AnalysisSettings) => void;
  onAnalyze: () => void;
  onRun: () => void;
  loading: boolean;
  running: boolean;
  compilerId: string;
  onCompilerChange: (id: string) => void;
  themeId: string;
  onThemeChange: (id: string) => void;
}

const ANALYSIS_OPTIONS: { value: AnalysisType; label: string }[] = [
  { value: "layout", label: "Struct Layout" },
  { value: "stack", label: "Stack Frame" },
  { value: "pointers", label: "Heap & Pointers" },
];

export default function Toolbar({
  settings,
  onSettingsChange,
  onAnalyze,
  onRun,
  loading,
  running,
  compilerId,
  onCompilerChange,
  themeId,
  onThemeChange,
}: ToolbarProps) {
  const toggleType = (t: AnalysisType) => {
    const types = settings.analysisTypes.includes(t)
      ? settings.analysisTypes.filter((x) => x !== t)
      : [...settings.analysisTypes, t];
    onSettingsChange({ ...settings, analysisTypes: types });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-wrap">
      {/* Target selector */}
      <label className="flex items-center gap-2 text-sm text-gray-300">
        Target:
        <select
          value={settings.target}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              target: e.target.value as TargetPlatform,
            })
          }
          className="bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          {(
            Object.entries(TARGET_LABELS) as [TargetPlatform, string][]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* Analysis type toggles */}
      <div className="flex items-center gap-2">
        {ANALYSIS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleType(opt.value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              settings.analysisTypes.includes(opt.value)
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Compiler selector for Run */}
      <label className="flex items-center gap-2 text-sm text-gray-300">
        Compiler:
        <select
          value={compilerId}
          onChange={(e) => onCompilerChange(e.target.value)}
          className="bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-purple-500"
        >
          {COMPILERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      {/* Theme selector */}
      <label className="flex items-center gap-2 text-sm text-gray-300">
        Theme:
        <select
          value={themeId}
          onChange={(e) => onThemeChange(e.target.value)}
          className="bg-gray-700 text-gray-200 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-cyan-500"
        >
          <optgroup label="Custom">
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Built-in">
            {BUILTIN_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      {/* Action buttons */}
      <div className="ml-auto flex items-center gap-2">
        {/* Run button */}
        <button
          onClick={onRun}
          disabled={running}
          className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
          title={`Compile & run on Godbolt (${COMPILERS.find((c) => c.id === compilerId)?.label ?? compilerId})`}
        >
          {running ? (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <span>▶</span>
          )}
          {running ? "Running…" : "Run"}
        </button>

        {/* Analyze button */}
        <button
          onClick={onAnalyze}
          disabled={loading || settings.analysisTypes.length === 0}
          className="px-5 py-1.5 rounded bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center gap-2"
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>
    </div>
  );
}
