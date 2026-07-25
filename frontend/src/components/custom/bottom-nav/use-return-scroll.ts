"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { scrollWindowTo } from "@/utils/scroll";

export interface IUseReturnScrollResult {
  /** A position is held, so the active cell shows its return chevron */
  hasReturnPosition: boolean;
  toggleScroll: () => void;
}

/**
 * Re-tapping the active tab scrolls to the top, and a second tap returns. The
 * window has to be moved explicitly, since the router does not scroll when you
 * navigate to the URL you are already on.
 */
export default function useReturnScroll(): IUseReturnScrollResult {
  const pathname = usePathname();
  const reduced = useReducedMotionSafe();
  const [returnTo, setReturnTo] = useState<number | null>(null);

  // A position from one route means nothing on the next.
  useEffect(() => setReturnTo(null), [pathname]);

  function toggleScroll() {
    if (returnTo !== null) {
      scrollWindowTo(returnTo, reduced);
      setReturnTo(null);
      return;
    }

    setReturnTo(window.scrollY);
    scrollWindowTo(0, reduced);
  }

  return { hasReturnPosition: returnTo !== null, toggleScroll };
}
