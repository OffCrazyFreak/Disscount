"use client";

import { useEffect, useState } from "react";

/** Held out here because the disc's element is replaced on every navigation, and the value it animates from would be lost with it. */
export default function useIndicatorOpacity(isSearchActive: boolean) {
  const [wasSearchActive, setWasSearchActive] = useState(isSearchActive);

  // After commit, not during render as lint wants, because the disc must mount with the previous value to have something to animate away from.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setWasSearchActive(isSearchActive), [isSearchActive]);

  return { from: wasSearchActive ? 0 : 1, to: isSearchActive ? 0 : 1 };
}

export type IndicatorOpacity = ReturnType<typeof useIndicatorOpacity>;
