"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { SHEET_DRAG_EXPAND_PX } from "@/constants/gestures";

/**
 * vaul clamps a bottom drawer's upward movement, so an expand-on-drag-up has to
 * be added. It composes safely because vaul calls the caller's pointer handlers
 * before its own, which leaves swipe-to-close untouched.
 */
export default function useBottomSheetDragExpand(onDragUp?: () => void) {
  const startY = useRef<number | null>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    startY.current = onDragUp ? event.clientY : null;
  }

  // Mid-drag rather than on release, so the sheet grows under the finger.
  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (startY.current === null) return;
    if (startY.current - event.clientY < SHEET_DRAG_EXPAND_PX) return;

    startY.current = null;
    onDragUp?.();
  }

  function onPointerUp() {
    startY.current = null;
  }

  return { onPointerDown, onPointerMove, onPointerUp };
}
