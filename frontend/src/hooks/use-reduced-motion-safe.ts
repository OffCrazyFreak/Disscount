"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// Stays false through hydration so markup matches, then flips after mount.
//
// The gate is still required as of framer-motion 12.42: useReducedMotion reads
// matchMedia during render, not in an effect, so it returns null on the server and
// the real preference on the very first client render. Since this hook branches
// markup rather than styling, that difference is a hydration error, not a flash.
// Recheck on a motion major before deleting it. See LANDING.md.
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted && !!reduced;
}
