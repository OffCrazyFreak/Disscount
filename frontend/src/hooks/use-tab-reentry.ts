"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { scrollWindowTo } from "@/utils/scroll";

interface ISavedPosition {
  y: number;
  /** Path plus query, so a filter change cannot return you to a stale offset */
  key: string;
}

function currentKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Tapping the tab you are already on scrolls to the top, and tapping it again
 * returns you to where you were. The documented convention in Expo's native
 * tabs, Ionic, Instagram and Medium, with X's return trip on top.
 *
 * Next does not scroll when navigating to the URL you are already on, so this
 * has to move the window itself. The key is read from window rather than
 * useSearchParams, which in root-layout chrome would drop every page out of the
 * prerender.
 */
export default function useTabReentry() {
  const [saved, setSaved] = useState<ISavedPosition | null>(null);
  const pathname = usePathname();

  // A position saved on one route means nothing on the next one. React's documented
  // alternative, adjusting during render against a previous-pathname state, would
  // work here and buys nothing: it trades this line for a second piece of state, and
  // `saved` is only ever read by `reenter`, which cannot run during that render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSaved(null), [pathname]);

  const reenter = useCallback(() => {
    if (window.scrollY > 0) {
      // Keep the first position. A second tap lands mid-animation, when scrollY
      // is an offset the user was never parked at.
      setSaved(
        (current) => current ?? { y: window.scrollY, key: currentKey() },
      );
      scrollWindowTo(0);
      return;
    }

    if (!saved) return;

    if (saved.key !== currentKey()) {
      setSaved(null);
      return;
    }

    scrollWindowTo(saved.y);
    setSaved(null);
  }, [saved]);

  return { reenter, canReturn: saved !== null };
}
