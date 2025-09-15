"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/typings/view-mode";
import {
  getViewMode,
  setViewMode as setViewModeInStorage,
} from "@/lib/api/local-storage";

// Hook to persist view mode per page path inside the single app storage object.
// Uses the existing app storage wrapper so all settings live under one key.
export function useViewMode(path: string, defaultMode: ViewMode = "grid") {
  const [mode, setModeInternal] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    try {
      const stored = getViewMode(path, defaultMode);
      if (stored && stored !== mode) setModeInternal(stored);
    } catch (error) {
      // ignore
    }
  }, []);

  // Persist to local storage when mode changes
  useEffect(() => {
    try {
      setViewModeInStorage(path, mode);
    } catch (error) {
      // ignore
    }
  }, [path, mode]);

  // helper to set both state and storage
  const setMode = (v: ViewMode) => setModeInternal(v);

  return [mode, setMode] as const;
}
