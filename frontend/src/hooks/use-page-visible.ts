"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);

  return () => document.removeEventListener("visibilitychange", onChange);
}

function getSnapshot() {
  return document.visibilityState === "visible";
}

/**
 * Whether the tab is in the foreground, read as an external store so no render
 * is ever stale. Nothing about it is scanner-specific; anything that should idle
 * in a background tab can use it.
 */
export default function usePageVisible() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => true, // assume visible during SSR
  );
}
