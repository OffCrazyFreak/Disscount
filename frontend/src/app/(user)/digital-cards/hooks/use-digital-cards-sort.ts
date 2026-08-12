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
    // Not derivable during render: localStorage does not exist on the server, so the
    // first client render has to match the server's default before correcting itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCardSortMode(stored)) setSort(stored);
  }, []);

  function updateSort(mode: CardSortMode) {
    setSort(mode);
    setDigitalCardSort(mode);
  }

  return [sort, updateSort] as const;
}
