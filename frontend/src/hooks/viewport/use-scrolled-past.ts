"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("scroll", onStoreChange, { passive: true });

  return () => window.removeEventListener("scroll", onStoreChange);
}

/** Reads the scroll position as external, not mirrored from an effect, so no render has a stale answer. */
export function useScrolledPast(threshold: number): boolean {
  const getSnapshot = useCallback(
    () => window.scrollY > threshold,
    [threshold],
  );

  // The server has no scroll position, so nothing has been scrolled past yet.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
