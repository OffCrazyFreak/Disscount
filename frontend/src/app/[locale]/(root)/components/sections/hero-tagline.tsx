"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { tagLineIds } from "@/app/[locale]/(root)/data/landing";

const ROTATE_INTERVAL_MS = 4000;

// SSR always renders the first tagline, so the HTML stays deterministic.
export default function HeroTagline() {
  const t = useTranslations("landing");
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    // Variety without animation: one random tagline per load. Deliberately after
    // mount, because Math.random() during render would not match the server's
    // deterministic tagLines[0]. See LANDING.md.
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(Math.floor(Math.random() * tagLineIds.length));
      return;
    }

    const id = setInterval(() => {
      setIndex((current) => (current + 1) % tagLineIds.length);
    }, ROTATE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [reduced]);

  const tagline = t(`taglines.${tagLineIds[index]}`);

  if (reduced) {
    return (
      <span className="relative block h-7 sm:h-8 leading-tight overflow-hidden">
        <span className="block">{tagline}</span>
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
          {tagline}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
