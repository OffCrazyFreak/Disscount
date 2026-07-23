import { useSyncExternalStore } from "react";

import { getLastLoginMethod } from "@/utils/browser/local-storage";

// Cross-tab only: same-tab writes happen right before a redirect anyway.
function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// useSyncExternalStore keeps the badge SSR-safe without a state-setting effect.
export function useLastLoginMethod() {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getLastLoginMethod(),
    () => null,
  );
}
