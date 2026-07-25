"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import useLongPressTimer from "@/hooks/use-long-press-timer";

export interface IUseLongPressResult {
  handlers: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
  };
  /** Reads true once after a hold fired, so a click handler can bail */
  consumeFired: () => boolean;
}

/**
 * Element handlers for a hold on something inside the page scroller, which is
 * why it neither captures the pointer nor suppresses touch panning: the
 * pointercancel a pan sends is exactly what should abandon the hold.
 *
 * There is no contextmenu handling, because that event has not fired on an iOS
 * long press since iOS 13.1, which is why a hold is a pointer-down timer at all.
 */
export default function useLongPress(
  onFire: () => void,
  enabled = true,
): IUseLongPressResult {
  const timer = useLongPressTimer();
  const origin = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!enabled) return;

    fired.current = false;
    origin.current = { x: event.clientX, y: event.clientY };

    timer.start(event.currentTarget, () => {
      fired.current = true;
      onFire();
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const start = origin.current;
    if (!start) return;

    const travelled = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    );
    if (travelled <= HOLD_CANCEL_PX) return;

    end();
  }

  function end() {
    origin.current = null;
    timer.stop();
  }

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: end,
      onPointerCancel: end,
    },
    consumeFired: () => {
      const hasFired = fired.current;
      fired.current = false;

      return hasFired;
    },
  };
}
