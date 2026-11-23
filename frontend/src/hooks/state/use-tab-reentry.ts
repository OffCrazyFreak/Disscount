"use client";

import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { scrollWindowTo } from "@/utils/ui/scroll";

interface ISavedPosition {
  y: number;
  /** Path plus query, so a filter change cannot return you to a stale offset */
  key: string;
}

// Safari before 26 fires no scrollend, so the animation is assumed over after this.
const SCROLL_END_FALLBACK_MS = 1500;

function currentKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Next does not scroll to the current URL; window, as useSearchParams would break the prerender. */
export default function useTabReentry() {
  const [saved, setSaved] = useState<ISavedPosition | null>(null);
  /** Where our own smooth scroll is heading, null once it settles. */
  const flightTarget = useRef<number | null>(null);
  const flightId = useRef(0);
  const pathname = usePathname();

  // A saved position means nothing on the next route; adjusting in render only adds state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSaved(null), [pathname]);

  function animateTo(top: number) {
    const id = ++flightId.current;
    flightTarget.current = top;

    // Only this scroll may settle itself, so an older scroll's fallback cannot end a newer one.
    function settle() {
      if (flightId.current === id) flightTarget.current = null;
      window.removeEventListener("scrollend", settle);
    }

    window.addEventListener("scrollend", settle, { once: true });
    window.setTimeout(settle, SCROLL_END_FALLBACK_MS);
    scrollWindowTo(top);
  }

  function reenter() {
    if (window.scrollY > 0) {
      // A tap mid-scroll lands where the user never parked, so it saves where that scroll was going.
      const target = flightTarget.current;
      const position = {
        y: target !== null && target > 0 ? target : window.scrollY,
        key: currentKey(),
      };

      setSaved((current) => (target === 0 && current ? current : position));
      animateTo(0);
      return;
    }

    if (!saved) return;

    if (saved.key !== currentKey()) {
      setSaved(null);
      return;
    }

    animateTo(saved.y);
    setSaved(null);
  }

  return { reenter, canReturn: saved !== null };
}
