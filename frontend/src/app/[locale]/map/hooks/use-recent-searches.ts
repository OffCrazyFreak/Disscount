"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  addMapRecentSearch,
  clearMapRecentSearches,
  getMapRecentSearches,
} from "@/utils/browser/storage/map";

// Search runs as you type, so only a query left alone this long is one the
// user actually meant, not a half-typed word.
const SETTLE_MS = 2_000;

const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let snapshot: string[] | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): string[] {
  snapshot ??= getMapRecentSearches();
  return snapshot;
}

function refresh() {
  snapshot = getMapRecentSearches();
  listeners.forEach((listener) => listener());
}

/** Remembers settled store-map searches on this device. */
export function useRecentSearches(query: string, hasResults: boolean) {
  const recent = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  useEffect(() => {
    if (!query.trim() || !hasResults) return;

    const timer = setTimeout(() => {
      addMapRecentSearch(query);
      refresh();
    }, SETTLE_MS);

    return () => clearTimeout(timer);
  }, [query, hasResults]);

  function clear() {
    clearMapRecentSearches();
    refresh();
  }

  return { recent, clear };
}
