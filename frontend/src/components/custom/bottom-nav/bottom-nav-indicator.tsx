"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CELL_DISC_CLASS } from "@/components/custom/bottom-nav/bottom-nav-classes";
import type { IndicatorOpacity } from "@/components/custom/bottom-nav/use-indicator-opacity";

interface IBottomNavIndicatorProps {
  /** Where the fade starts and ends, from useIndicatorOpacity */
  opacity: IndicatorOpacity;
}

/** One cell renders it at a time, so `layoutId` slides it; Lucide has no filled icons for active state. */
export default function BottomNavIndicator({
  opacity,
}: IBottomNavIndicatorProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      layoutId="bottom-nav-indicator"
      aria-hidden="true"
      // The spring drives the fade too, so the disc dissolves onto the search cell and resolves off it.
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
