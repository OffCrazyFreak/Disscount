"use client";

import { motion, useReducedMotion } from "motion/react";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

interface IBottomNavIndicatorProps {
  /** Where the fade starts and ends, from useIndicatorOpacity */
  opacity: IndicatorOpacity;
}

/**
 * The active-tab disc, shared across cells by `layoutId` so it slides rather
 * than reappearing. Living in the root layout is what keeps one instance alive
 * across navigations, which is what makes the shared layout animation possible.
 *
 * It encloses both the icon and the label, and carries the active state without
 * relying on colour, which matters twice over: Lucide is outline-only, so there
 * is no filled counterpart to swap in.
 */
export default function BottomNavIndicator({
  opacity,
}: IBottomNavIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      layoutId="bottom-nav-indicator"
      aria-hidden="true"
      // The spring drives the fade as well as the slide, so the disc dissolves on
      // its way onto the search cell and resolves on its way off it.
      initial={{ opacity: opacity.from }}
      animate={{ opacity: opacity.to }}
      // 3.6rem is 57.6px: enough to pad the widest label once bold (Potrošnja,
      // about 48px) while still fitting a 59.8px cell at a 320px viewport.
      className="bg-primary/15 absolute top-1/2 left-1/2 size-[3.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 30 }
      }
    />
  );
}
