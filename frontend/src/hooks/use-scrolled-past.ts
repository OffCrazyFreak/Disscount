"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("scroll", onStoreChange, { passive: true });

  return () => window.removeEventListener("scroll", onStoreChange);
}

/**
 * Whether the window is scrolled past `threshold` pixels.
 *
 * Reads the scroll position as the external value it is, rather than mirroring
 * it into state from an effect, so there is no render with a stale answer.
 */
export function useScrolledPast(threshold: number): boolean {
  const getSnapshot = useCallback(
    () => window.scrollY > threshold,
    [threshold],
  );

  // The server has no scroll position, so nothing has been scrolled past yet.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
