import { useSyncExternalStore } from "react";

// Tailwind's md breakpoint as Tailwind writes it, so a larger browser font moves the script and the CSS together.
const MOBILE_QUERY = "(width < 48rem)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
