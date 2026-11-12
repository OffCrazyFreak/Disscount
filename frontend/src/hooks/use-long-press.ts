"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import useLongPressTimer from "@/hooks/use-long-press-timer";

interface IUseLongPressOptions {
  onLongPress: () => void;
}

/** Pointer Events rather than `contextmenu`, which iOS has not fired on long press since 13.1. */
export default function useLongPress({ onLongPress }: IUseLongPressOptions) {
  const timer = useLongPressTimer();
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef(onLongPress);

  // Kept fresh in an effect, so start() never has to be re-bound to see it.
  useEffect(() => {
    latest.current = onLongPress;
  });

  const start = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      // Touch and pen only, or the callout suppression would take the desktop context menu.
      if (event.pointerType === "mouse" || !event.isPrimary) return;

      origin.current = { x: event.clientX, y: event.clientY };
      timer.start(event.currentTarget, () => latest.current());
    },
    [timer],
  );

  const move = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!timer.isPending()) return;

      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;

      if (Math.hypot(dx, dy) > HOLD_CANCEL_PX) timer.cancel();
    },
    [timer],
  );

  return {
    onPointerDown: start,
    onPointerMove: move,
    // pointercancel arrives free when a scroll or pan claims the pointer
    onPointerUp: timer.cancel,
    onPointerCancel: timer.cancel,
    onPointerLeave: timer.cancel,
    // The whole gesture, as the hold fires at 450ms and Chrome's link menu at about 500, over the sheet.
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      if (timer.isPending() || timer.hasFired()) event.preventDefault();
    },
    /** True once the press fired, so a click handler can skip its own action */
    hasFired: timer.hasFired,
  };
}
