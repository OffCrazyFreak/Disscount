import { useEffect, useState } from "react";

import {
  getDigitalCardSort,
  setDigitalCardSort,
} from "@/utils/browser/local-storage";
import {
  DEFAULT_CARD_SORT,
  isCardSortMode,
  type CardSortMode,
} from "@/app/(user)/digital-cards/utils/card-sorting";

/** Storage keeps a bare string, so the stored value is validated on the way back in. */
export function useDigitalCardsSort() {
  const [sort, setSort] = useState<CardSortMode>(DEFAULT_CARD_SORT);

  // Hydrated after mount, so the server render and the first client render agree.
  useEffect(() => {
    const stored = getDigitalCardSort();
    if (isCardSortMode(stored)) setSort(stored);
  }, []);

  function updateSort(mode: CardSortMode) {
    setSort(mode);
    setDigitalCardSort(mode);
  }

  return [sort, updateSort] as const;
}
