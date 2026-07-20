import { useSyncExternalStore } from "react";

import { getLastLoginMethod } from "@/utils/browser/local-storage";

// Re-read the badge when localStorage changes in another tab; same-tab writes happen right
// before a redirect, so a no-op there is fine.
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// The last-used method lives in localStorage (an external store); reading it via
// useSyncExternalStore keeps the badge SSR-safe without a state-setting effect.
export function useLastLoginMethod() {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getLastLoginMethod(),
    () => null,
  );
}
