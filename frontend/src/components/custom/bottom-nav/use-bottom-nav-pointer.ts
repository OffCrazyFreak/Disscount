"use client";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BAR_EDGE_EXCLUSION_PX, HOLD_CANCEL_PX } from "@/constants/gestures";
import startHoldTimer, { type IHoldTimer } from "@/utils/long-press";

const PROGRESS_PROPERTY = "--press-progress";

interface IUseBottomNavPointerOptions {
  indexFromClientX: (clientX: number) => number | null;
  cellAt: (index: number) => HTMLElement | null;
  onActivate: (index: number) => void;
  holdFor: (index: number) => (() => void) | null;
}

/**
 * One pointer path for the whole bar, which is what lets a tap, a scrub and a
 * hold compose: a tap is a zero-distance scrub. Progress goes straight to the
 * pressed cell as a custom property, so the ring never re-renders a subtree.
 */
export default function useBottomNavPointer({
  indexFromClientX,
  cellAt,
  onActivate,
  holdFor,
}: IUseBottomNavPointerOptions) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const current = useRef<number | null>(null);
  const startX = useRef(0);
  const consumed = useRef(false);
  const timer = useRef<IHoldTimer | null>(null);

  function cancelHold() {
    timer.current?.cancel();
    timer.current = null;
  }

  function startHold(index: number) {
    const hold = holdFor(index);
    if (!hold) return;

    const element = cellAt(index);

    timer.current = startHoldTimer({
      onFire: () => {
        consumed.current = true;
        hold();
      },
      onProgress: (progress) =>
        element?.style.setProperty(PROGRESS_PROPERTY, String(progress)),
    });
  }

  function moveTo(index: number | null) {
    if (index === current.current) return;

    cancelHold();
    current.current = index;
    setScrubIndex(index);

    if (index !== null) startHold(index);
  }

  function begin(event: ReactPointerEvent<HTMLElement>) {
    const nearEdge =
      event.clientX < BAR_EDGE_EXCLUSION_PX ||
      event.clientX > window.innerWidth - BAR_EDGE_EXCLUSION_PX;

    if (nearEdge) return;

    const index = indexFromClientX(event.clientX);
    if (index === null) return;

    startX.current = event.clientX;
    consumed.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);

    moveTo(index);
  }

  function move(event: ReactPointerEvent<HTMLElement>) {
    if (current.current === null) return;

    if (Math.abs(event.clientX - startX.current) > HOLD_CANCEL_PX) cancelHold();

    const index = indexFromClientX(event.clientX);
    if (index !== null && index !== current.current) moveTo(index);
  }

  function finish(event: ReactPointerEvent<HTMLElement>, activate: boolean) {
    if (current.current === null) return;

    // The implicit release on pointerup is unreliable, and a capture that
    // outlives its gesture retargets the next one to the container.
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);

    const index = current.current;

    cancelHold();
    current.current = null;
    setScrubIndex(null);

    if (activate && !consumed.current) onActivate(index);
  }

  return {
    scrubIndex,
    barProps: {
      onPointerDown: begin,
      onPointerMove: move,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) =>
        finish(event, true),
      onPointerCancel: (event: ReactPointerEvent<HTMLElement>) =>
        finish(event, false),
    },
  };
}
