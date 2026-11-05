"use client";

import { useCallback, useSyncExternalStore, type RefObject } from "react";
import { HEADER_BOTTOM_CHANGE_EVENT } from "@/hooks/use-header-bottom-variable";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  window.addEventListener("resize", onStoreChange);
  // The header resizes as it animates, which moves the sticky top without a scroll.
  window.addEventListener(HEADER_BOTTOM_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("scroll", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
    window.removeEventListener(HEADER_BOTTOM_CHANGE_EVENT, onStoreChange);
  };
}

/**
 * Whether a sticky bar is stuck: its container has scrolled above the bar's
 * sticky `top`. Read from the container, whose position the bar's own size
 * changes cannot move, so restyling a stuck bar never unsticks it.
 */
export function useIsStuck(
  containerRef: RefObject<HTMLElement | null>,
  barRef: RefObject<HTMLElement | null>,
): boolean {
  const getSnapshot = useCallback(() => {
    const container = containerRef.current;
    const bar = barRef.current;
    if (!container || !bar) return false;

    const stuckTop = parseFloat(getComputedStyle(bar).top) || 0;

    // At or above, not only above: a tab switch from the stuck bar lands it exactly on the line.
    return container.getBoundingClientRect().top <= stuckTop;
  }, [containerRef, barRef]);

  // The server has no scroll position, so nothing is stuck yet.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
