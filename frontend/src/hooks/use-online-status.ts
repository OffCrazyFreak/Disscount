"use client";

import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

// Reads React Query's onlineManager, so the whole app shares one source of truth.
export function useOnlineStatus() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true, // assume online during SSR
  );
}
