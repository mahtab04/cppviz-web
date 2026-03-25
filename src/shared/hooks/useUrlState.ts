import { useState, useCallback } from "react";

export function useUrlState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const hash = window.location.hash.replace(/^#state=/, "");
      if (hash) {
        const decoded = JSON.parse(decodeURIComponent(atob(hash)));
        return { ...initialState, ...decoded };
      }
    } catch (err) {
      console.warn("Failed to parse URL state", err);
    }
    return initialState;
  });

  const setUrlState = useCallback((newState: Partial<T>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState };
      const encoded = btoa(encodeURIComponent(JSON.stringify(updated)));
      window.history.replaceState(null, "", `#state=${encoded}`);
      return updated;
    });
  }, []);

  return [state, setUrlState] as const;
}
