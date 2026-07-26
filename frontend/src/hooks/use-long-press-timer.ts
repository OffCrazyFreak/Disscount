"use client";

import { useCallback, useEffect, useRef } from "react";
import { createLongPressTimer, type ILongPressTimer } from "@/utils/long-press";

/**
 * The React half of the long press, shared by the bar and the product cards,
 * which own very different pointer streams but the same timer lifecycle.
 *
 * Progress is written straight to the element captured at press time rather than
 * into state, so neither filling nor draining the ring re-renders a subtree, and
 * a drain outlives the gesture that started it.
 */
export default function useLongPressTimer() {
  const timer = useRef<ILongPressTimer | null>(null);
  const element = useRef<HTMLElement | null>(null);
  const fire = useRef<() => void>(() => {});

  // dispose, not cancel: cancel starts a drain, which would keep scheduling
  // frames against a detached element.
  useEffect(() => () => timer.current?.dispose(), []);

  // Built on first press rather than during render, so the ref is only ever
  // touched from an event handler.
  const getTimer = useCallback(() => {
    timer.current ??= createLongPressTimer({
      onFire: () => fire.current(),
      onProgress: (fraction) =>
        element.current?.style.setProperty("--press-progress", `${fraction}`),
    });

    return timer.current;
  }, []);

  const start = useCallback(
    (target: HTMLElement | null, onFire: () => void) => {
      // A drain still running on the previous element is about to be cleared, so
      // zero it here or it keeps a half-filled ring for good.
      element.current?.style.setProperty("--press-progress", "0");

      element.current = target;
      fire.current = onFire;

      getTimer().start();
    },
    [getTimer],
  );

  const cancel = useCallback(() => timer.current?.cancel(), []);

  return {
    start,
    cancel,
    isPending: () => timer.current?.isPending() ?? false,
    hasFired: () => timer.current?.hasFired() ?? false,
  };
}
