"use client";

import {
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import startHoldTimer, { type IHoldTimer } from "@/utils/long-press";

const PROGRESS_PROPERTY = "--press-progress";

/**
 * A hold on one element, sharing the bar's timing through the same timer.
 *
 * Deliberately sets no touch-action: pointercancel is what abandons the gesture
 * once a scroll claims the pointer, and suppressing panning suppresses that too.
 */
export default function useLongPress(onHold: (() => void) | null) {
  const timer = useRef<IHoldTimer | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const fired = useRef(false);

  function cancel() {
    timer.current?.cancel();
    timer.current = null;
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!onHold) return;

    const element = event.currentTarget;

    origin.current = { x: event.clientX, y: event.clientY };
    fired.current = false;

    timer.current = startHoldTimer({
      onFire: () => {
        fired.current = true;
        onHold();
      },
      onProgress: (progress) =>
        element.style.setProperty(PROGRESS_PROPERTY, String(progress)),
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!timer.current) return;

    const moved = Math.hypot(
      event.clientX - origin.current.x,
      event.clientY - origin.current.y,
    );

    if (moved > HOLD_CANCEL_PX) cancel();
  }

  // A hold that fired must not also trigger whatever a tap would have done.
  function onClickCapture(event: ReactMouseEvent) {
    if (!fired.current) return;

    fired.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  return {
    holdProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onClickCapture,
    },
  };
}
