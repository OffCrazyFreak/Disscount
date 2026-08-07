"use client";

import { useCallback, useEffect, useState } from "react";

interface ISettlingNavigation {
  index: number;
  routeKey: string;
}

/**
 * Holds the destination cell's preview in place between a committed tap and the
 * route actually landing, so the disc does not snap back to where it started.
 *
 * Owns the record's whole lifecycle, which is the point of it living here: the
 * one-shot clear used to be missing entirely, and a spent record re-matched the
 * moment the user returned to that pathname by any other route.
 */
export default function useSettlingNavPreview(routeKey: string) {
  const [settling, setSettling] = useState<ISettlingNavigation | null>(null);

  // Spent as soon as the route it was waiting on is no longer current. The read
  // below already ignores a stale record, so this is the release, not the
  // correctness guard: it stops a spent record re-matching when the user returns to
  // the same routeKey later. A previous-routeKey render adjustment would also cover
  // that, at the cost of a second piece of state.
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
