"use client";

import { useEffect, useState } from "react";
import { ViewMode } from "@/typings/view-mode";
import { getViewMode, setViewMode } from "@/utils/browser/local-storage";

// Persists per page path inside the single app storage object.
export function useViewMode(path: string, defaultMode: ViewMode = "list") {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  // The read stays deferred to an effect on purpose: getViewMode returns defaultMode
  // on the server, so seeding state with it directly would render the default in the
  // HTML and the stored mode on the first client render, which is a hydration
  // mismatch. Keyed on path, because one mount can outlive a route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(getViewMode(path, defaultMode));
  }, [path, defaultMode]);

  // Written here rather than in an effect on `mode`. That effect also ran on mount,
  // before the read above had applied, so it persisted the default over whatever was
  // already stored. A write only ever means a user choice, so it belongs on the event.
  function selectMode(next: ViewMode) {
    setMode(next);
    setViewMode(path, next);
  }

  return [mode, selectMode] as const;
}
