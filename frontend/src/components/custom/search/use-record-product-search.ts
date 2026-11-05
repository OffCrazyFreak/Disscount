import { useEffect } from "react";

import { productRecentSearches } from "@/utils/browser/storage/recent-searches";

// Module state because the submitting field can unmount (the phone sheet) before results land.
let submittedQuery: string | null = null;

export function markProductSearchSubmitted(query: string) {
  submittedQuery = query;
}

/**
 * Remembers a search once it has found something. Only one a field submitted:
 * a shared link or Back also lands on `q`, and neither is this person's search.
 */
export function useRecordProductSearch(query: string, hasResults: boolean) {
  useEffect(() => {
    if (!hasResults || query !== submittedQuery) return;

    submittedQuery = null;
    productRecentSearches.add(query);
  }, [query, hasResults]);
}
