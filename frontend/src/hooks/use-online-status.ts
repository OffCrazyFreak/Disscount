"use client";

import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

// Reflects connectivity using React Query's onlineManager (navigator.onLine +
// online/offline events), so the whole app shares one source of truth.
export function useOnlineStatus() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true, // assume online during SSR
  );
}
