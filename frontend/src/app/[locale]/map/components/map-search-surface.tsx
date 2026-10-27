"use client";

import { motion, Transition } from "motion/react";

// Cut down to the bar's own box rather than resized, so nothing inside it
// scales or reflows while it grows. 3.8rem is the bar's bottom edge.
const PILL_CLIP = "inset(1rem 1rem calc(100% - 3.8rem) 1rem round 1rem)";
const FULL_CLIP = "inset(0rem 0rem calc(0% - 0rem) 0rem round 0rem)";

interface IMapSearchSurfaceProps {
  isOpen: boolean;
  transition: Transition;
}

/**
 * The bar's background, growing from the bar to the whole screen. No backdrop
 * blur: blurring a live WebGL map costs mid-range phones dearly, more so while
 * the surface grows.
 */
export default function MapSearchSurface({
  isOpen,
  transition,
}: IMapSearchSurfaceProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 bg-background"
      initial={false}
      animate={{
        clipPath: isOpen ? FULL_CLIP : PILL_CLIP,
        opacity: isOpen ? 1 : 0.9,
      }}
      transition={transition}
    />
  );
}
