"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CELL_DISC_CLASS } from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

interface IBottomNavIndicatorProps {
  /** Where the fade starts and ends, from useIndicatorOpacity */
  opacity: IndicatorOpacity;
}

/**
 * The active-tab disc. Exactly one cell renders it at a time, so `layoutId` sees
 * the old element leave and the new one arrive and interpolates between their
 * boxes, which is what makes it slide rather than reappear.
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
      className={cn(CELL_DISC_CLASS, "bg-primary/15 rounded-full")}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 30 }
      }
    />
  );
}
