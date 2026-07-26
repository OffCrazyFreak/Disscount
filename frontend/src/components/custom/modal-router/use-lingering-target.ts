"use client";

import { useEffect, useState } from "react";

/** Long enough for a dialog's or a drawer's exit animation to finish */
const EXIT_MS = 200;

/**
 * Keeps the last non-null value mounted after it clears, so a modal can play its
 * exit animation instead of vanishing the moment the URL drops its parameter.
 */
export default function useLingeringTarget<T>(target: T | null): T | null {
  const [lingering, setLingering] = useState(target);

  // Adjust-during-render, so tracking the latest target needs no effect.
  if (target && target !== lingering) setLingering(target);

  useEffect(() => {
    if (target) return;

    const timer = setTimeout(() => setLingering(null), EXIT_MS);

    return () => clearTimeout(timer);
  }, [target]);

  return target ?? lingering;
}
