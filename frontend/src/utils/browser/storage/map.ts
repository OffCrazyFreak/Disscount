import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

const MAX_RECENT_SEARCHES = 5;

/** Last store-map searches on this device, newest first. */
export function getMapRecentSearches(): string[] {
  return getAppStorage().mapRecentSearches ?? [];
}

/** Moves a search to the front, dropping duplicates and the oldest past the cap. */
export function addMapRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;

  const rest = getMapRecentSearches().filter(
    (previous) => previous.toLowerCase() !== trimmed.toLowerCase(),
  );

  setAppStorage({
    mapRecentSearches: [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES),
  });
}

export function clearMapRecentSearches() {
  setAppStorage({ mapRecentSearches: undefined });
}
