"use client";

import { useEffect, type RefObject } from "react";

/** Fired on window each time `--header-bottom` takes a new value. */
export const HEADER_BOTTOM_CHANGE_EVENT = "disscount:header-bottom-change";

/** So sticky bars and scroll offsets sit right under the fixed header at every width and state. */
export function useHeaderBottomVariable(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const root = document.documentElement;
    let published: number | null = null;

    function publish() {
      if (!header) return;

      // Whole pixels: the frame animates its size, and sub-pixel steps would rewrite this every frame.
      const bottom = Math.round(header.getBoundingClientRect().bottom);
      if (bottom === published) return;

      published = bottom;
      root.style.setProperty("--header-bottom", `${bottom}px`);
      window.dispatchEvent(new Event(HEADER_BOTTOM_CHANGE_EVENT));
    }

    // Measured now as well, since the page's hash jump runs before the first observer callback.
    publish();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(publish);
    observer?.observe(header);

    return () => {
      observer?.disconnect();
      root.style.removeProperty("--header-bottom");
    };
  }, [ref]);
}
