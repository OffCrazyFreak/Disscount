"use client";

import { type RefObject, useEffect } from "react";

// One box height ahead, so the next rows are there before the reader reaches the bottom.
function isNearScrollEnd(box: HTMLElement): boolean {
  return box.scrollTop + 2 * box.clientHeight >= box.scrollHeight;
}

/** Like useOnNearPageEnd, for a list that scrolls inside its own box instead of the page. */
export function useOnNearScrollEnd(
  boxRef: RefObject<HTMLElement | null>,
  onNearEnd: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    const box = boxRef.current;
    if (!enabled || !box) return;

    function onScroll() {
      if (box && isNearScrollEnd(box)) onNearEnd();
    }

    box.addEventListener("scroll", onScroll, { passive: true });
    return () => box.removeEventListener("scroll", onScroll);
  }, [boxRef, onNearEnd, enabled]);
}
