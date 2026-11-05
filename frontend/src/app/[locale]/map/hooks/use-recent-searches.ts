"use client";

import { useEffect } from "react";

import { createRecentSearchStore } from "@/utils/browser/storage/recent-searches";

// Search runs as you type, so only a query left alone this long is one the
// user actually meant, not a half-typed word.
const SETTLE_MS = 2_000;

const mapRecentSearches = createRecentSearchStore("mapRecentSearches");

/** Remembers settled store-map searches on this device. */
export function useRecentSearches(query: string, hasResults: boolean) {
  const recent = mapRecentSearches.useSearches();

  useEffect(() => {
    if (!query.trim() || !hasResults) return;

    const timer = setTimeout(() => mapRecentSearches.add(query), SETTLE_MS);

    return () => clearTimeout(timer);
  }, [query, hasResults]);

  return { recent, clear: mapRecentSearches.clear };
}
