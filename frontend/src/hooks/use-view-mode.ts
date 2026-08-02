"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/typings/view-mode";
import { getViewMode, setViewMode } from "@/utils/browser/local-storage";

// Persists per page path inside the single app storage object.
export function useViewMode(path: string, defaultMode: ViewMode = "list") {
  const [mode, setModeInternal] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    try {
      const stored = getViewMode(path, defaultMode);
      if (stored && stored !== mode) setModeInternal(stored);
    } catch {
      // Storage can be unavailable or corrupt; the default mode is fine.
    }
  }, []);

  // Persist to local storage when mode changes
  useEffect(() => {
    try {
      setViewMode(path, mode);
    } catch {
      // Storage can be unavailable or full; losing the preference is acceptable.
    }
  }, [path, mode]);

  // helper to set both state and storage
  const setMode = (v: ViewMode) => setModeInternal(v);

  return [mode, setMode] as const;
}
