"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// Stays false through hydration so markup matches, then flips after mount.
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && !!reduced;
}
