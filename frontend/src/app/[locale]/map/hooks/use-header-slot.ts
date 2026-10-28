"use client";

import { useEffect, useState } from "react";

import { HEADER_SLOT_ID } from "@/components/custom/header/header-slot";

export interface IFrameBox {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

interface IHeaderSlot {
  slot: HTMLElement | null;
  frame: IFrameBox | null;
}

/**
 * The shared header's slot for the map's search, and the box of the header's
 * frame around it, which the search grows from and the list starts below.
 */
export function useHeaderSlot(): IHeaderSlot {
  const [state, setState] = useState<IHeaderSlot>({ slot: null, frame: null });

  // Looked up once the page has committed: a language switch remounts the
  // layout, and during that render the old header's slot is still in the page.
  useEffect(() => {
    const slot = document.getElementById(HEADER_SLOT_ID);
    const frameElement = slot?.closest<HTMLElement>("[data-header-frame]");
    if (!slot || !frameElement) return;

    function measure() {
      const box = frameElement!.getBoundingClientRect();
      setState({
        slot,
        frame: {
          top: box.top,
          left: box.left,
          right: window.innerWidth - box.right,
          bottom: box.bottom,
        },
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
  }, []);

  return state;
}
