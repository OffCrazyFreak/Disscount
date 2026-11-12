"use client";

import { useEffect } from "react";

import { isNearPageEnd } from "@/utils/scroll";

/** Calls onNearEnd on each scroll that comes near the page end while enabled. */
export function useOnNearPageEnd(onNearEnd: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    function onScroll() {
      if (isNearPageEnd()) onNearEnd();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onNearEnd, enabled]);
}
