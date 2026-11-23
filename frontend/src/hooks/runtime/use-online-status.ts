"use client";

import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

export function useOnlineStatus() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );
}
