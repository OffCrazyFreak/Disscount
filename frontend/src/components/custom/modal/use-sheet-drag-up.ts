"use client";

import { useRef, type PointerEvent } from "react";

/** Far enough that a deliberate pull up is not a stray touch */
const SHEET_DRAG_EXPAND_PX = 40;

/**
 * Pointer props that fire once per gesture when the sheet is dragged upward,
 * which vaul itself ignores: a bottom drawer clamps upward movement.
 *
 * Plain React handlers rather than native listeners, because vaul composes its
 * own: its `onPointerDown`, `onPointerMove` and `onPointerUp` each call the
 * caller's first and then run the drag logic, so passing these through costs it
 * nothing. It fires mid-drag rather than on release, so the sheet grows under the
 * finger that asked for it.
 */
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
