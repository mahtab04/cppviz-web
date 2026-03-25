import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

interface ToastContextType {
  toast: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastNotification key={t.id} item={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastNotification({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const colors = {
    success: "bg-green-600/90 border-green-500",
    info: "bg-blue-600/90 border-blue-500",
    error: "bg-red-600/90 border-red-500",
  };

  const icons = {
    success: "✓",
    info: "ℹ",
    error: "✕",
  };

  return (
    <div
      className={`pointer-events-auto px-4 py-2.5 rounded-lg border text-white text-sm font-medium shadow-xl transition-all duration-300 flex items-center gap-2 ${
        colors[item.type]
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <span className="text-base">{icons[item.type]}</span>
      {item.message}
    </div>
  );
}
