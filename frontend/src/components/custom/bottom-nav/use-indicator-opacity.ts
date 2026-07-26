"use client";

import { useEffect, useState } from "react";

/**
 * The opacity pair the active disc animates between, so it dissolves on the
 * raised search cell where `bg-primary/15` over `bg-primary` reads as a smudge.
 *
 * The previous value has to be held out here rather than in the disc itself: the
 * disc's element is replaced on every navigation, so the value it animates *from*
 * would be lost with it. One pair serves every cell, since the target is only 0
 * while the search cell is the active one, and that is the only time it renders
 * the disc.
 */
export default function useIndicatorOpacity(isSearchActive: boolean) {
  const [wasSearchActive, setWasSearchActive] = useState(isSearchActive);

  // Deliberately after the commit, not during render: the disc has to mount with
  // the previous value to have something to animate away from.
  useEffect(() => setWasSearchActive(isSearchActive), [isSearchActive]);

  return { from: wasSearchActive ? 0 : 1, to: isSearchActive ? 0 : 1 };
}

export type IndicatorOpacity = ReturnType<typeof useIndicatorOpacity>;
