"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { scrollWindowTo } from "@/utils/scroll";

interface IReturnPosition {
  pathname: string;
  y: number;
}

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
  const [stored, setStored] = useState<IReturnPosition | null>(null);

  // A position from one route means nothing on the next, so it expires by
  // comparison rather than by an effect that resets it.
  const held = stored?.pathname === pathname ? stored : null;

  function toggleScroll() {
    if (held) {
      scrollWindowTo(held.y, reduced);
      setStored(null);
      return;
    }

    setStored({ pathname, y: window.scrollY });
    scrollWindowTo(0, reduced);
  }

  return { hasReturnPosition: held !== null, toggleScroll };
}
