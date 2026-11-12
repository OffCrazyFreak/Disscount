"use client";

import { useCallback, useSyncExternalStore } from "react";

// replaceState fires no hashchange, so a tab switch announces itself.
const HASH_TAB_CHANGE_EVENT = "disscount:hash-tab-change";

function readHash(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    // A hand-typed hash such as "#%" is not valid percent-encoding and must not crash the page.
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener(HASH_TAB_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener(HASH_TAB_CHANGE_EVENT, onChange);
  };
}

/** In the hash so a shared link opens it; the server has no hash, so hydration shows the first tab. */
export function useHashTab(ids: string[]) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const activeId = ids.includes(hash) ? hash : ids[0];

  const selectTab = useCallback((id: string) => {
    // Replaced, not pushed: Back should leave the page, not step through its tabs.
    const url = new URL(window.location.href);
    url.hash = id;
    // Never pass history.state, or Next skips its sync and drops the hash; see lib/modal/modal-navigation.ts.
    window.history.replaceState({}, "", url);
    window.dispatchEvent(new Event(HASH_TAB_CHANGE_EVENT));
  }, []);

  return { activeId, selectTab };
}
