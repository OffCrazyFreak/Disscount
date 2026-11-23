"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);

  return () => document.removeEventListener("visibilitychange", onChange);
}

function getSnapshot() {
  return document.visibilityState === "visible";
}

/** Read as an external store so no render is ever stale. */
export default function usePageVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
