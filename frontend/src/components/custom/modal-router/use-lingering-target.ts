"use client";

import { useEffect, useState } from "react";

/** A Radix dialog animates for 200ms; vaul ships a 500ms drawer slide. */
export const DIALOG_EXIT_MS = 200;
export const SHEET_EXIT_MS = 500;

/**
 * Keeps the last non-null value mounted after it clears, so a modal can play its
 * exit animation instead of vanishing the moment the URL drops its parameter.
 * Unmounting early cuts the animation off partway.
 */
export default function useLingeringTarget<T>(
  target: T | null,
  exitMs: number = DIALOG_EXIT_MS,
): T | null {
  const [lingering, setLingering] = useState(target);

  // Adjust-during-render, so tracking the latest target needs no effect.
  if (target && target !== lingering) setLingering(target);

  useEffect(() => {
    if (target) return;

    const timer = setTimeout(() => setLingering(null), exitMs);

    return () => clearTimeout(timer);
  }, [target, exitMs]);

  return target ?? lingering;
}
