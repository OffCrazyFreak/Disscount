"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getRowCount,
  setRowCount,
  subscribeToRowCounts,
} from "@/lib/skeleton/row-count-store";

/**
 * How many placeholder rows a list skeleton should draw, based on how long that
 * list was last time.
 *
 * The persisted React Query cache is IndexedDB, which resolves asynchronously,
 * so it cannot answer this on the first paint. A small synchronous localStorage
 * note can, which is what makes the skeleton reserve close to the real height
 * instead of a generic three rows.
 *
 * The server snapshot is the fallback, so `loading.tsx` and the first client
 * render agree and hydration stays quiet.
 */
export function useRememberedRowCount(key: string, fallback: number): number {
  return useSyncExternalStore(
    subscribeToRowCounts,
    () => getRowCount(key) ?? fallback,
    () => fallback,
  );
}

/** Records the real length once it is known, for the next cold load. */
export function useRememberRowCount(key: string, count: number | undefined) {
  useEffect(() => {
    if (count === undefined || count <= 0) return;

    setRowCount(key, count);
  }, [key, count]);
}
