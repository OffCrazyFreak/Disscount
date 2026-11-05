"use client";

import { useEffect, useState } from "react";

/** Held here because each navigation replaces the disc's element, losing the value it animates from. */
export default function useIndicatorOpacity(isSearchActive: boolean) {
  const [wasSearchActive, setWasSearchActive] = useState(isSearchActive);

  // After commit, not during render as lint wants, or the disc has nothing to animate away from.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setWasSearchActive(isSearchActive), [isSearchActive]);

  return { from: wasSearchActive ? 0 : 1, to: isSearchActive ? 0 : 1 };
}

export type IndicatorOpacity = ReturnType<typeof useIndicatorOpacity>;
