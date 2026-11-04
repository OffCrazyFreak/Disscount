"use client";

import { useEffect, useState } from "react";

/** A Radix dialog animates for 200ms; ui/drawer.tsx slides out within 400ms. */
const DIALOG_EXIT_MS = 200;
export const SHEET_EXIT_MS = 450;

/** Keeps the last value mounted after it clears, or the modal's exit animation is cut off when the URL drops its parameter. */
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
