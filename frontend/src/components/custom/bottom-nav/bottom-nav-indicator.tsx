"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The active-tab pill, shared across cells by `layoutId` so it slides rather
 * than reappearing. Living in the root layout is what keeps one instance alive
 * across navigations, which is what makes the shared layout animation possible.
 *
 * A pill carries the active state without relying on colour, which matters twice
 * over: Lucide is outline-only, so there is no filled counterpart to swap in.
 */
export default function BottomNavIndicator() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      layoutId="bottom-nav-indicator"
      aria-hidden="true"
      className="bg-primary/15 absolute top-1/2 left-1/2 h-[2.1rem] w-[3.25rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 30 }
      }
    />
  );
}
