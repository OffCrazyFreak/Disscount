import { useEffect } from "react";

import { productRecentSearches } from "@/utils/browser/storage/recent-searches";

// Module state because the submitting field can unmount (the phone sheet) before results land.
let submittedQuery: string | null = null;

export function markProductSearchSubmitted(query: string) {
  submittedQuery = query;
}

export function forgetSubmittedProductSearch() {
  submittedQuery = null;
}

/** Only a submitted search counts: a shared link or Back also lands on `q`, and neither is this person's. */
export function useRecordProductSearch(query: string, hasResults: boolean) {
  useEffect(() => {
    if (!hasResults || query !== submittedQuery) return;

    submittedQuery = null;
    productRecentSearches.add(query);
  }, [query, hasResults]);
}
