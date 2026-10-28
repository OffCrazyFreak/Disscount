"use client";

import { useEffect, useState } from "react";

import { HEADER_SLOT_ID } from "@/components/custom/header/header-slot";

export interface IFrameBox {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/**
 * The shared header's slot for the map's search, and the box of the header's
 * frame around it, which the search grows from and the list starts below.
 */
export function useHeaderSlot() {
  // The phone layout renders only in the browser, after the header is mounted.
  const [slot] = useState(() => document.getElementById(HEADER_SLOT_ID));
  const [frame, setFrame] = useState<IFrameBox | null>(null);

  useEffect(() => {
    const frameElement = slot?.closest<HTMLElement>("[data-header-frame]");
    if (!frameElement) return;

    function measure() {
      const box = frameElement!.getBoundingClientRect();
      setFrame({
        top: box.top,
        left: box.left,
        right: window.innerWidth - box.right,
        bottom: box.bottom,
      });
    }

    // Observing reports the first size too.
    const observer = new ResizeObserver(measure);
    observer.observe(frameElement);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [slot]);

  return { slot, frame };
}
