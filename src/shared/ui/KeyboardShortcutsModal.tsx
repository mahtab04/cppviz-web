import { useState } from "react";

const SHORTCUTS = [
  { keys: ["Ctrl", "Enter"], action: "Analyze memory layout" },
  { keys: ["Ctrl", "Shift", "Enter"], action: "Compile & run via Godbolt" },
  { keys: ["Ctrl", "S"], action: "Save (no-op, prevents browser save)" },
  { keys: ["Ctrl", "/"], action: "Toggle line comment" },
  { keys: ["Ctrl", "D"], action: "Select next occurrence" },
  { keys: ["Ctrl", "Shift", "K"], action: "Delete line" },
  { keys: ["Tab"], action: "Accept autocomplete / indent" },
];

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-md bg-gray-700/50 hover:bg-gray-600 border border-gray-600 text-gray-400 hover:text-white text-sm flex items-center justify-center transition-colors"
        title="Keyboard shortcuts"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-gray-800 border border-gray-600 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="text-base font-bold font-display text-white">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-2">
              {SHORTCUTS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-1 rounded hover:bg-gray-700/40 transition-colors"
                >
                  <span className="text-sm text-gray-300">{s.action}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key, j) => (
                      <span key={j}>
                        <kbd className="px-2 py-0.5 text-xs font-mono bg-gray-900 border border-gray-600 rounded text-gray-300 shadow-sm">
                          {key}
                        </kbd>
                        {j < s.keys.length - 1 && (
                          <span className="text-gray-500 mx-0.5">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-700 text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-gray-900 border border-gray-600 rounded text-gray-400 font-mono">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
