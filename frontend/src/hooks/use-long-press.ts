"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  createLongPressTimer,
  LONG_PRESS_MOVE_TOLERANCE_PX,
  type ILongPressTimer,
} from "@/utils/long-press";

interface IUseLongPressOptions {
  onLongPress: () => void;
  enabled?: boolean;
}

/**
 * Long press for a single element, via Pointer Events rather than `contextmenu`,
 * which iOS has not fired on long press since 13.1.
 *
 * Progress is written straight to the element as `--press-progress` instead of
 * through state, so the ring animates without re-rendering its subtree 27 times
 * per press.
 */
export default function useLongPress({
  onLongPress,
  enabled = true,
}: IUseLongPressOptions) {
  const timer = useRef<ILongPressTimer | null>(null);
  const element = useRef<HTMLElement | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef(onLongPress);

  useEffect(() => {
    latest.current = onLongPress;
  });

  useEffect(() => () => timer.current?.cancel(), []);

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
      if (!enabled || !event.isPrimary) return;

      element.current = event.currentTarget;
      origin.current = { x: event.clientX, y: event.clientY };
      getTimer().start();
    },
    [enabled, getTimer],
  );

  const move = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!timer.current?.isPending()) return;

    const dx = event.clientX - origin.current.x;
    const dy = event.clientY - origin.current.y;

    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX)
      timer.current.cancel();
  }, []);

  const cancel = useCallback(() => timer.current?.cancel(), []);

  return {
    onPointerDown: start,
    onPointerMove: move,
    // pointercancel arrives free when a scroll or pan claims the pointer
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (event: { preventDefault: () => void }) =>
      event.preventDefault(),
    /** True once the press fired, so a click handler can skip its own action */
    hasFired: () => timer.current?.hasFired() ?? false,
  };
}
