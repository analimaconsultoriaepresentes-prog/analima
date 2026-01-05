import { useState, useEffect } from "react";

const STORAGE_KEY = "products_view_mode";

export type ViewMode = "list" | "cards";

export function useViewMode(defaultMode: ViewMode = "list"): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "list" || stored === "cards") ? stored : defaultMode;
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return [viewMode, setViewMode];
}
