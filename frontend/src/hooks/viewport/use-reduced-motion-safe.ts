"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// useReducedMotion reads matchMedia in render, a hydration error here; recheck on a motion major (LANDING.md).
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted && !!reduced;
}
