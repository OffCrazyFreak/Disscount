"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/typings/view-mode";
import { getViewMode, setViewMode } from "@/utils/browser/local-storage";

// TODO(#61): the setter has no callers while ViewSwitcher stays parked, so review the read and write paths together with it.
export function useViewMode(path: string, defaultMode: ViewMode = "list") {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  // Deferred to an effect, because seeding with the stored mode would mismatch the server's default; keyed on path, as a mount can outlive a route.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(getViewMode(path, defaultMode));
  }, [path, defaultMode]);

  // On the event, not an effect on `mode`, which also ran on mount and persisted the default over what was stored.
  function selectMode(next: ViewMode) {
    setMode(next);
    setViewMode(path, next);
  }

  return [mode, selectMode] as const;
}
