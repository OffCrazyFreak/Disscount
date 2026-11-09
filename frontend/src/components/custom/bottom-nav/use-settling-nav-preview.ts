"use client";

import { useCallback, useEffect, useState } from "react";

interface ISettlingNavigation {
  index: number;
  routeKey: string;
}

/** Owns the whole lifecycle, so a spent record cannot re-match on a later return to that pathname. */
export default function useSettlingNavPreview(routeKey: string) {
  const [settling, setSettling] = useState<ISettlingNavigation | null>(null);

  // Released once its route stops being current, stopping a later re-match on the same routeKey.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settling && settling.routeKey !== routeKey) setSettling(null);
  }, [settling, routeKey]);

  // Stable, so the pointer hook's callbacks are not rebuilt on every render.
  const markNavigated = useCallback((index: number, from: string) => {
    setSettling({ index, routeKey: from });
  }, []);

  const clear = useCallback(() => setSettling(null), []);

  return {
    /** The cell to keep previewing, or null once the route has caught up */
    settlingIndex: settling?.routeKey === routeKey ? settling.index : null,
    markNavigated,
    clear,
  };
}
