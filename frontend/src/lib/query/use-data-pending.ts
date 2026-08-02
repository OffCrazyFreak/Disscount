"use client";

import { useIsRestoring } from "@tanstack/react-query";

/**
 * True while there is still nothing real to render. Reach for this instead of a
 * query's `isLoading`.
 *
 * `isLoading` is wrong under PersistQueryClientProvider. It parks every query at
 * fetchStatus "idle" while restoring the IndexedDB cache, and v5 derives
 * `isLoading` as `isPending && isFetching`, so throughout that window it reads
 * false with `data` still undefined. A guard written on it falls straight
 * through to the next branch, which is what painted "Greška" on the detail
 * pages and "(0)" in the index headings for a frame on every reload.
 *
 * Pass each query's `isPending`, plus any non-query gate the render waits on
 * (auth still resolving, a URL param not parsed yet). Note that a query with
 * `enabled: false` reports `isPending` forever, so gate that flag on whatever
 * disables it, or use useAuthedQuery, which already does.
 */
export function useDataPending(...flags: boolean[]): boolean {
  const isRestoring = useIsRestoring();

  return isRestoring || flags.some(Boolean);
}
