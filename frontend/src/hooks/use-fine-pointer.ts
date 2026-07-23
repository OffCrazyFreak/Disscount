import { useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

// True on devices with a real cursor (mouse/trackpad); false on touch and SSR.
export function useFinePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
