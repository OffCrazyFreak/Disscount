"use client";

import { usePathname } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { scrollWindowTo } from "@/utils/scroll";

interface ISavedPosition {
  y: number;
  /** Path plus query, so a filter change cannot return you to a stale offset */
  key: string;
}

function currentKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** Next does not scroll to the URL you are on, so this moves the window; window, because useSearchParams would drop pages from the prerender. */
export default function useTabReentry() {
  const [saved, setSaved] = useState<ISavedPosition | null>(null);
  const pathname = usePathname();

  // A position saved on one route means nothing on the next; adjusting during render would only add a second piece of state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSaved(null), [pathname]);

  const reenter = useCallback(() => {
    if (window.scrollY > 0) {
      // Keep the first position, because a second tap lands mid-animation at an offset the user was never parked at.
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
