"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publishes the fixed header's bottom edge as `--header-bottom` on the root, so
 * sticky bars and scroll offsets sit right under it at every width and state.
 */
export function useHeaderBottomVariable(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current;
    if (!header || typeof ResizeObserver === "undefined") return;

    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      // Fixed, so the bottom edge is the same at any scroll position.
      const bottom = header.getBoundingClientRect().bottom;
      root.style.setProperty("--header-bottom", `${bottom}px`);
    });

    observer.observe(header);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--header-bottom");
    };
  }, [ref]);
}
