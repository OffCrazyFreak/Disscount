"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// Hydration-safe reduced-motion flag: stays false during SSR and the hydration
// render so server and client markup match, then flips after mount for users
// who prefer reduced motion.
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !!reduced;
}
