"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { scrollWindowTo } from "@/utils/scroll";

/**
 * Tapping the tab you are already on scrolls to the top, and tapping it again
 * returns you to where you were. The documented convention in Expo's native
 * tabs, Ionic, Instagram and Medium, with X's return trip on top.
 *
 * Next does not scroll when navigating to the URL you are already on, so this
 * has to move the window itself.
 */
export default function useTabReentry() {
  const [savedY, setSavedY] = useState<number | null>(null);
  const pathname = usePathname();

  // A position saved on one route means nothing on the next one.
  useEffect(() => setSavedY(null), [pathname]);

  const reenter = useCallback(() => {
    if (window.scrollY > 0) {
      setSavedY(window.scrollY);
      scrollWindowTo(0);
      return;
    }

    if (savedY === null) return;

    scrollWindowTo(savedY);
    setSavedY(null);
  }, [savedY]);

  return { reenter, canReturn: savedY !== null };
}
