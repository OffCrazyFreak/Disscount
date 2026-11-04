"use client";

import { useRef, type PointerEvent } from "react";

/** Far enough that a deliberate pull up is not a stray touch */
const SHEET_DRAG_EXPAND_PX = 40;

/** Fires mid-drag so the sheet grows under the finger; plain handlers, because Base UI's swipe handlers sit on the viewport, not this popup. */
export default function useSheetDragUp(onDragUp?: () => void) {
  const startY = useRef<number | null>(null);

  if (!onDragUp) return {};

  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      startY.current = event.clientY;
    },

    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      if (startY.current === null) return;
      if (startY.current - event.clientY < SHEET_DRAG_EXPAND_PX) return;

      startY.current = null;
      onDragUp();
    },

    onPointerUp: () => {
      startY.current = null;
    },

    onPointerCancel: () => {
      startY.current = null;
    },
  };
}
