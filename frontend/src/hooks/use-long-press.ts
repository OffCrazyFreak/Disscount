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

/**
 * Long press for a single element, via Pointer Events rather than `contextmenu`,
 * which iOS has not fired on long press since 13.1. The timer itself lives in
 * useLongPressTimer, shared with the bottom bar.
 */
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
      // Touch and pen only. Holding a mouse button is not a long press, and the
      // callout suppression below would take the desktop context menu with it.
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
    // Suppressed for the whole gesture, not just while it is pending. The hold
    // fires at 450ms and Chrome on Android raises its link menu at roughly 500,
    // so checking isPending alone let the menu open on top of the sheet that had
    // just opened. hasFired stays true until the next start(), and a desktop
    // right-click never starts one, so its menu is untouched.
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      if (timer.isPending() || timer.hasFired()) event.preventDefault();
    },
    /** True once the press fired, so a click handler can skip its own action */
    hasFired: timer.hasFired,
  };
}
