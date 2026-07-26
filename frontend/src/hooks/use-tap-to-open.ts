"use client";

import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";

/**
 * Radix opens a menu on pointerdown, so on a touchscreen it springs open the
 * moment a finger lands, including when that finger was only starting a scroll:
 * https://github.com/radix-ui/primitives/issues/1912
 *
 * Touch presses are swallowed and resolved on release instead, and one that
 * travels far enough to be a scroll opens nothing. Mouse and keyboard keep
 * Radix's own behaviour.
 */
export default function useTapToOpen() {
  const [open, setOpen] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);

  const start = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;

    pointerId.current = event.pointerId;
    origin.current = { x: event.clientX, y: event.clientY };
    // Radix skips its own handler once the event is defaultPrevented.
    event.preventDefault();
  }, []);

  const move = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!origin.current || event.pointerId !== pointerId.current) return;

    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;

    if (Math.hypot(dx, dy) > HOLD_CANCEL_PX) origin.current = null;
  }, []);

  const cancel = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerId !== pointerId.current) return;

    origin.current = null;
    pointerId.current = null;
  }, []);

  // Only the finger that started the press may resolve it, so a second touch
  // cannot toggle the menu or release someone else's gesture.
  const commit = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!origin.current || event.pointerId !== pointerId.current) return;

    origin.current = null;
    pointerId.current = null;
    setOpen((current) => !current);
  }, []);

  return {
    rootProps: { open, onOpenChange: setOpen },
    triggerProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: commit,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
    },
  };
}
