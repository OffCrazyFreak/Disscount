"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { tagLines } from "@/app/(root)/data/landing";

const ROTATE_INTERVAL_MS = 4000;

// SSR always renders the first tagline, so the HTML stays deterministic.
export default function HeroTagline() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    // Variety without animation: one random tagline per load.
    if (reduced) {
      setIndex(Math.floor(Math.random() * tagLines.length));
      return;
    }

    const id = setInterval(() => {
      setIndex((current) => (current + 1) % tagLines.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <span className="relative block h-7 sm:h-8 leading-tight overflow-hidden">
        <span className="block">{tagLines[index]}</span>
      </span>
    );
  }

  return (
    <span className="relative block h-7 sm:h-8 leading-tight overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={index}
          className="block"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {tagLines[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
