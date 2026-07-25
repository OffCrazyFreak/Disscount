import { getAppStorage, setAppStorage } from "@/utils/browser/storage/core";

const MAX_RECENT_SEARCHES = 6;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    return getAppStorage().recentSearches ?? [];
  } catch {
    return [];
  }
}

/** Puts the query first, without letting a repeat search grow the list */
export function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (typeof window === "undefined" || !trimmed) return;

  try {
    const rest = getRecentSearches().filter(
      (entry) => entry.toLowerCase() !== trimmed.toLowerCase(),
    );

    setAppStorage({
      recentSearches: [trimmed, ...rest].slice(0, MAX_RECENT_SEARCHES),
    });
  } catch (e) {
    console.error("Failed to add recent search", e);
  }
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return;

  try {
    setAppStorage({ recentSearches: [] });
  } catch (e) {
    console.error("Failed to clear recent searches", e);
  }
}
