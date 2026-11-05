"use client";

import { useReducedMotion } from "motion/react";

// Material 3's emphasized decelerate in, emphasized accelerate out.
const OPEN = { duration: 0.4, ease: [0.05, 0.7, 0.1, 1] } as const;
const CLOSE = { duration: 0.2, ease: [0.3, 0, 0.8, 0.15] } as const;
const INSTANT = { duration: 0 } as const;

/** The timing for the search bar growing open or shrinking shut. */
export function useMorphTransition(isOpen: boolean) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return INSTANT;
  return isOpen ? OPEN : CLOSE;
}
