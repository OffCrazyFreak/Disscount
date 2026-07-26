"use client";

import { useCallback, useEffect, useRef } from "react";
import { createLongPressTimer, type ILongPressTimer } from "@/utils/long-press";

/**
 * The hold half of the bar's gesture: the timing, and the progress its ring
 * reads. Progress is written straight to the pressed cell rather than into
 * state, so neither filling nor draining the ring re-renders a subtree.
 */
export default function useCellHold() {
  const timer = useRef<ILongPressTimer | null>(null);
  const cell = useRef<HTMLElement | null>(null);
  const fire = useRef<() => void>(() => {});

  useEffect(() => () => timer.current?.dispose(), []);

  function resetCell() {
    cell.current?.style.setProperty("--press-progress", "0");
  }

  // Built on first press rather than during render, so the ref is only ever
  // touched from an event handler.
  const getTimer = useCallback(() => {
    timer.current ??= createLongPressTimer({
      onFire: () => fire.current(),
      // Written to the element captured at press time, not to whichever cell is
      // pressed now, so a drain outlives the gesture that started it.
      onProgress: (fraction) =>
        cell.current?.style.setProperty("--press-progress", `${fraction}`),
    });

    return timer.current;
  }, []);

  const start = useCallback(
    (target: Element | undefined, onFire: () => void) => {
      // A drain still running on the previous cell is about to be cleared, so
      // zero that cell here or it keeps a half-filled ring for good.
      resetCell();

      cell.current = target instanceof HTMLElement ? target : null;
      fire.current = onFire;

      getTimer().start();
    },
    [getTimer],
  );

  const cancel = useCallback(() => timer.current?.cancel(), []);

  return { start, cancel };
}
