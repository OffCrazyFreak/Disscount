"use client";

import { useCallback, useEffect, useRef } from "react";
import { createLongPressTimer, type ILongPressTimer } from "@/utils/long-press";

/** Progress is written to the captured element, not state, so the ring re-renders nothing and a drain outlives its gesture. */
export default function useLongPressTimer() {
  const timer = useRef<ILongPressTimer | null>(null);
  const element = useRef<HTMLElement | null>(null);
  const fire = useRef<() => void>(() => {});

  // dispose, not cancel, because cancel starts a drain that keeps scheduling frames against a detached element.
  useEffect(() => () => timer.current?.dispose(), []);

  // Built on first press, not during render, so the ref is only touched from an event handler.
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
      // A drain still running on the previous element is about to be cleared, so zero it or it keeps a half-filled ring.
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
