"use client";

import { useEffect, useSyncExternalStore } from "react";

const holds = new Set<string>();
const listeners = new Set<() => void>();

function setHold(key: string, isHeld: boolean) {
  const changed = isHeld ? !holds.has(key) : holds.has(key);
  if (!changed) return;

  if (isHeld) holds.add(key);
  else holds.delete(key);

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** Lifts one hold, such as the map's credits folding; it comes back only when its holder asks again. */
export function releaseInstallBannerHold(key: string) {
  setHold(key, false);
}

/** Keeps the install banner hidden while this page part needs the space, such as the map's credits or open search. */
export function useInstallBannerHold(key: string, isHeld: boolean) {
  useEffect(() => {
    setHold(key, isHeld);

    return () => setHold(key, false);
  }, [key, isHeld]);
}

export function useIsInstallBannerHeld() {
  return useSyncExternalStore(
    subscribe,
    () => holds.size > 0,
    () => false,
  );
}
