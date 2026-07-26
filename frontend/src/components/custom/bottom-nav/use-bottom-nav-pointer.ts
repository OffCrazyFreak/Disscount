"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import indexFromPoint, {
  navCells,
} from "@/components/custom/bottom-nav/bar-hit-test";
import useLongPressTimer from "@/hooks/use-long-press-timer";

/** The rounded pill's own corners, where a press is more likely a swipe home */
const BAR_EDGE_EXCLUSION_PX = 16;

interface IUseBottomNavPointerOptions {
  onActivate: (index: number) => void;
  /** What a hold on this cell does, or null when the cell has none */
  holdFor: (index: number) => (() => void) | null;
}

/**
 * One pointer stream for the whole bar, because a tap is just a zero-distance
 * scrub. Pressing captures the pointer, the active disc follows the thumb across
 * cells, and release commits whichever cell it ended over. Straying off the bar
 * resolves to no cell, so that release commits nothing.
 *
 * Activation happens on pointerup rather than through each cell's click, since
 * capturing the pointer on the list retargets the click away from the button.
 * Cells still handle keyboard-driven clicks, which carry no pointer.
 */
export default function useBottomNavPointer({
  onActivate,
  holdFor,
}: IUseBottomNavPointerOptions) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const hold = useLongPressTimer();
  const pressedIndex = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const consumed = useRef(false);
  const latest = useRef({ onActivate, holdFor });

  useEffect(() => {
    latest.current = { onActivate, holdFor };
  });

  const start = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      const nearEdge =
        event.clientX < BAR_EDGE_EXCLUSION_PX ||
        window.innerWidth - event.clientX < BAR_EDGE_EXCLUSION_PX;

      // isPrimary identifies the primary pointer, not the pressed button, so a
      // right-click would otherwise start and commit a gesture.
      const isMainButton = event.pointerType !== "mouse" || event.button === 0;

      if (!event.isPrimary || !isMainButton || nearEdge) return;

      const index = indexFromPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      if (index === null) return;

      pointerId.current = event.pointerId;
      pressedIndex.current = index;
      origin.current = { x: event.clientX, y: event.clientY };
      consumed.current = false;
      setScrubIndex(index);
      event.currentTarget.setPointerCapture(event.pointerId);

      const action = latest.current.holdFor(index);
      if (!action) return;

      hold.start(navCells(event.currentTarget)[index] ?? null, () => {
        consumed.current = true;
        action();
      });
    },
    [hold],
  );

  const move = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      if (pressedIndex.current === null) return;
      if (event.pointerId !== pointerId.current) return;

      const index = indexFromPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      const dx = event.clientX - origin.current.x;
      const dy = event.clientY - origin.current.y;

      setScrubIndex((current) => (current === index ? current : index));

      if (index !== pressedIndex.current || Math.hypot(dx, dy) > HOLD_CANCEL_PX)
        hold.cancel();
    },
    [hold],
  );

  /**
   * Capture is released explicitly. A capture that outlived its gesture
   * retargeted the next one to the list, which read as one tab activating
   * another.
   */
  const finish = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>, activates: boolean) => {
      // A second finger lands on the bar as its own pointer, and capture only
      // binds the first, so without this its release would commit the cell under
      // IT and cancel the real gesture.
      if (event.pointerId !== pointerId.current) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);

      if (pressedIndex.current === null) return;

      const index = activates
        ? indexFromPoint(event.currentTarget, event.clientX, event.clientY)
        : null;

      hold.cancel();
      pressedIndex.current = null;
      pointerId.current = null;
      setScrubIndex(null);

      if (activates && !consumed.current && index !== null)
        latest.current.onActivate(index);
    },
    [hold],
  );

  return {
    /** The cell under a dragging thumb, so the disc can preview it */
    scrubIndex,
    listProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, false),
      // Capture can be revoked with neither pointerup nor pointercancel, which
      // would strand the scrub highlight and a half-filled ring.
      onLostPointerCapture: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, false),
    },
  };
}
