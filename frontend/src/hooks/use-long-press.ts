"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import { createLongPressTimer, type ILongPressTimer } from "@/utils/long-press";

interface IUseLongPressOptions {
  onLongPress: () => void;
}

/**
 * Long press for a single element, via Pointer Events rather than `contextmenu`,
 * which iOS has not fired on long press since 13.1.
 *
 * Progress is written straight to the element as `--press-progress` instead of
 * through state, so the ring animates without re-rendering its subtree 27 times
 * per press.
 */
export default function useLongPress({ onLongPress }: IUseLongPressOptions) {
  const timer = useRef<ILongPressTimer | null>(null);
  const element = useRef<HTMLElement | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef(onLongPress);

  useEffect(() => {
    latest.current = onLongPress;
  });

  // dispose, not cancel: cancel starts a drain that would keep scheduling frames
  // against a detached element.
  useEffect(() => () => timer.current?.dispose(), []);

  // Built on first press rather than during render, so the ref is only ever
  // touched from an event handler.
  const getTimer = useCallback(() => {
    timer.current ??= createLongPressTimer({
      onFire: () => latest.current(),
      onProgress: (fraction) =>
        element.current?.style.setProperty("--press-progress", `${fraction}`),
    });

    return timer.current;
  }, []);

  const start = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      // Touch and pen only. Holding a mouse button is not a long press, and the
      // callout suppression below would take the desktop context menu with it.
      if (event.pointerType === "mouse" || !event.isPrimary) return;

      element.current = event.currentTarget;
      origin.current = { x: event.clientX, y: event.clientY };
      getTimer().start();
    },
    [getTimer],
  );

  const move = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!timer.current?.isPending()) return;

    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;

    if (Math.hypot(dx, dy) > HOLD_CANCEL_PX) timer.current.cancel();
  }, []);

  const cancel = useCallback(() => timer.current?.cancel(), []);

  return {
    onPointerDown: start,
    onPointerMove: move,
    // pointercancel arrives free when a scroll or pan claims the pointer
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // Suppressed only while a hold is in flight, so a desktop right-click, which
    // never starts one, keeps its menu.
    onContextMenu: (event: ReactMouseEvent<HTMLElement>) => {
      if (timer.current?.isPending()) event.preventDefault();
    },
    /** True once the press fired, so a click handler can skip its own action */
    hasFired: () => timer.current?.hasFired() ?? false,
  };
}
