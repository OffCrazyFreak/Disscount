"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { HOLD_CANCEL_PX } from "@/constants/gestures";
import indexFromPoint, {
  navCells,
} from "@/components/custom/bottom-nav/bar-hit-test";
import useLongPressTimer from "@/hooks/use-long-press-timer";
import useSettlingNavPreview from "@/components/custom/bottom-nav/use-settling-nav-preview";

/** The rounded pill's own corners, where a press is more likely a swipe home */
const BAR_EDGE_EXCLUSION_PX = 16;

interface IUseBottomNavPointerOptions {
  onActivate: (index: number) => boolean;
  /** What a hold on this cell does, or null when the cell has none */
  holdFor: (index: number) => (() => void) | null;
  /** Changes when a requested route has landed */
  routeKey: string;
}

/** On pointerup because pointer capture retargets click; cells still handle keyboard clicks. */
export default function useBottomNavPointer({
  onActivate,
  holdFor,
  routeKey,
}: IUseBottomNavPointerOptions) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const { settlingIndex, markNavigated, clear } =
    useSettlingNavPreview(routeKey);
  const hold = useLongPressTimer();
  const pressedIndex = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const consumed = useRef(false);
  const latest = useRef({ onActivate, holdFor, routeKey });

  useEffect(() => {
    latest.current = { onActivate, holdFor, routeKey };
  });

  const start = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>) => {
      const nearEdge =
        event.clientX < BAR_EDGE_EXCLUSION_PX ||
        window.innerWidth - event.clientX < BAR_EDGE_EXCLUSION_PX;

      // isPrimary ignores the button pressed, so a right-click would otherwise commit a gesture.
      const isMainButton = event.pointerType !== "mouse" || event.button === 0;

      if (!event.isPrimary || !isMainButton || nearEdge) return;

      const index = indexFromPoint(
        event.currentTarget,
        event.clientX,
        event.clientY,
      );
      if (index === null) return;

      // Capture first: a gone or synthetic pointer throws NotFoundError, and nothing undoes earlier state.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError")
          return;
        throw error;
      }

      pointerId.current = event.pointerId;
      pressedIndex.current = index;
      origin.current = { x: event.clientX, y: event.clientY };
      consumed.current = false;
      setScrubIndex(index);

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

  /** Released explicitly, because a capture outliving its gesture retargets the next one to the list. */
  const finish = useCallback(
    (event: ReactPointerEvent<HTMLUListElement>, activates: boolean) => {
      // A second finger is an unbound pointer, whose release would cancel the real gesture.
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

      const didNavigate =
        activates &&
        !consumed.current &&
        index !== null &&
        latest.current.onActivate(index);

      if (didNavigate && index !== null) {
        markNavigated(index, latest.current.routeKey);
      } else {
        clear();
      }
    },
    [hold, markNavigated, clear],
  );

  return {
    /** The cell under a dragging thumb, so the disc can preview it */
    scrubIndex,
    /** Keeps the destination preview in place while its route settles */
    previewIndex: scrubIndex ?? settlingIndex,
    listProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, false),
      // Capture can be revoked with no pointerup or pointercancel, stranding the highlight and ring.
      onLostPointerCapture: (event: ReactPointerEvent<HTMLUListElement>) =>
        finish(event, false),
    },
  };
}
