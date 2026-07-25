"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  createLongPressTimer,
  LONG_PRESS_MOVE_TOLERANCE_PX,
  type ILongPressTimer,
} from "@/utils/long-press";

/** Keeps a press clear of the iOS edge-swipe and home-indicator zones */
const EDGE_GUARD_PX = 16;

interface IUseBottomNavPointerOptions {
  onActivate: (index: number) => void;
  onLongPress: (index: number) => void;
  canLongPress: (index: number) => boolean;
}

/**
 * One pointer stream for the whole bar, because a tap is just a zero-distance
 * scrub. Pressing anywhere on the bar captures the pointer, the indicator
 * follows the thumb across cells, and release commits whichever cell it ended
 * over. Moving off the pressed cell abandons the long press.
 *
 * Activation happens on pointerup rather than through each cell's click, since
 * capturing the pointer on the list retargets the click away from the button.
 * Cells still handle keyboard-driven clicks, which arrive with `detail === 0`.
 */
export default function useBottomNavPointer({
  onActivate,
  onLongPress,
  canLongPress,
}: IUseBottomNavPointerOptions) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const timer = useRef<ILongPressTimer | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const pressedIndex = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const consumed = useRef(false);
  const latest = useRef({ onActivate, onLongPress, canLongPress });

  useEffect(() => {
    latest.current = { onActivate, onLongPress, canLongPress };
  });

  useEffect(() => () => timer.current?.cancel(), []);

  // Built on first press rather than during render, so the ref is only ever
  // touched from an event handler.
  const getTimer = useCallback(() => {
    timer.current ??= createLongPressTimer({
      onFire: () => {
        const index = pressedIndex.current;
        if (index === null) return;

        consumed.current = true;
        latest.current.onLongPress(index);
      },
      onProgress: (fraction) => {
        const index = pressedIndex.current;
        if (index === null) return;

        const cell = list.current?.children[index];
        if (cell instanceof HTMLElement) {
          cell.style.setProperty("--press-progress", `${fraction}`);
        }
      },
    });

    return timer.current;
  }, []);

  /**
   * Measured from the cells themselves rather than by dividing the bar's width,
   * so the pill's own inner padding cannot skew the boundaries. A pointer in
   * that padding resolves to the nearest cell.
   */
  const indexFrom = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      const cells = [...event.currentTarget.children];
      const x = event.clientX;

      const hit = cells.findIndex((cell) => {
        const rect = cell.getBoundingClientRect();
        return x >= rect.left && x <= rect.right;
      });

      if (hit !== -1) return hit;

      const firstLeft = cells[0].getBoundingClientRect().left;

      return x < firstLeft ? 0 : cells.length - 1;
    },
    [],
  );

  const start = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      const nearEdge =
        event.clientX < EDGE_GUARD_PX ||
        window.innerWidth - event.clientX < EDGE_GUARD_PX;

      if (!event.isPrimary || nearEdge) return;

      const index = indexFrom(event);

      list.current = event.currentTarget;
      pressedIndex.current = index;
      origin.current = { x: event.clientX, y: event.clientY };
      consumed.current = false;
      setScrubIndex(index);
      event.currentTarget.setPointerCapture(event.pointerId);

      if (latest.current.canLongPress(index)) getTimer().start();
    },
    [indexFrom, getTimer],
  );

  const move = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      if (pressedIndex.current === null) return;

      const index = indexFrom(event);
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;

      setScrubIndex((current) => (current === index ? current : index));

      if (
        index !== pressedIndex.current ||
        Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE_PX
      ) {
        timer.current?.cancel();
      }
    },
    [indexFrom],
  );

  /**
   * Capture is released explicitly. The spec releases it implicitly on pointerup,
   * but a capture that outlives the gesture would retarget the next one to the
   * list, so this does not rely on that.
   */
  const release = useCallback((event: ReactPointerEvent<HTMLUListElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const end = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      release(event);

      if (pressedIndex.current === null) return;

      const index = indexFrom(event);

      // Cancel before clearing the index, so the ring drains on the right cell.
      timer.current?.cancel();
      pressedIndex.current = null;
      setScrubIndex(null);

      if (!consumed.current) latest.current.onActivate(index);
    },
    [indexFrom, release],
  );

  const abort = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      release(event);
      timer.current?.cancel();
      pressedIndex.current = null;
      setScrubIndex(null);
    },
    [release],
  );

  return {
    /** The cell under a dragging thumb, so the indicator can preview it */
    scrubIndex,
    listProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: abort,
    },
  };
}
