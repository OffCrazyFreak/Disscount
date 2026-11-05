import { useSyncExternalStore } from "react";

import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

const MAX_RECENT_SEARCHES = 5;
const EMPTY: string[] = [];

type RecentSearchField = "mapRecentSearches" | "productRecentSearches";

/** One list of a surface's last searches on this device, newest first. */
export function createRecentSearchStore(field: RecentSearchField) {
  const listeners = new Set<() => void>();
  let snapshot: string[] | null = null;

  function read(): string[] {
    return getAppStorage()[field] ?? EMPTY;
  }

  function refresh() {
    snapshot = read();
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot(): string[] {
    snapshot ??= read();
    return snapshot;
  }

  return {
    /** Moves a search to the front, dropping duplicates and the oldest past the cap. */
    add(query: string) {
      const trimmed = query.trim();
      if (!trimmed) return;

      const rest = read().filter(
        (previous) => previous.toLowerCase() !== trimmed.toLowerCase(),
      );

      setAppStorage({
        [field]: [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES),
      });
      refresh();
    },

    remove(query: string) {
      setAppStorage({
        [field]: read().filter((previous) => previous !== query),
      });
      refresh();
    },

    clear() {
      setAppStorage({ [field]: undefined });
      refresh();
    },

    useSearches() {
      return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
    },
  };
}

export const productRecentSearches = createRecentSearchStore(
  "productRecentSearches",
);
