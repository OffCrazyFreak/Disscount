"use client";

import { useEffect, useState } from "react";

import {
  HEADER_SLOT_ID,
  HEADER_SLOT_OPEN_ATTR,
} from "@/components/custom/header/header-slot";

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

export function useHeaderSlot(): IHeaderSlot {
  const [state, setState] = useState<IHeaderSlot>({ slot: null, frame: null });

  // After commit, because during a language switch's remount the old slot is still in the page.
  useEffect(() => {
    const slot = document.getElementById(HEADER_SLOT_ID);
    const frameElement = slot?.closest<HTMLElement>("[data-header-frame]");
    if (!slot || !frameElement) return;

    function measure() {
      const box = frameElement!.getBoundingClientRect();
      // Open, the frame widens to the screen edges, so keep the closed left and right; height still follows rotation.
      const isOpen = slot!.querySelector(`[${HEADER_SLOT_OPEN_ATTR}]`) != null;

      setState((previous) => ({
        slot,
        frame: {
          top: box.top,
          bottom: box.bottom,
          ...(isOpen && previous.frame
            ? { left: previous.frame.left, right: previous.frame.right }
            : {
                left: box.left,
                right: document.documentElement.clientWidth - box.right,
              }),
        },
      }));
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
