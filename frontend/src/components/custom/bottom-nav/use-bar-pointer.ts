"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { BAR_EDGE_EXCLUSION_PX, HOLD_CANCEL_PX } from "@/constants/gestures";
import useLongPressTimer from "@/hooks/use-long-press-timer";

/** How far past the pill a thumb may stray and still count as on that cell */
const VERTICAL_SLOP_PX = 24;

interface IBarGesture {
  pointerId: number;
  pill: HTMLElement;
  cells: HTMLElement[];
  cellRects: DOMRect[];
  pillRect: DOMRect;
  startIndex: number;
  startX: number;
  startY: number;
}

export interface IUseBarPointerOptions {
  onActivate: (index: number) => void;
  onScrub: (index: number | null) => void;
  /** Answered by the same resolver that says what the hold does */
  hasHold: (index: number) => boolean;
  onHold: (index: number) => void;
}

/**
 * Tap, scrub and hold are one pointer path owned by the bar rather than three
 * handlers per cell, which is what makes them compose: a tap is a zero-distance
 * scrub. Capturing on the pill retargets the click, so activation runs on
 * pointer-up and the cells answer only keyboard clicks.
 */
export default function useBarPointer({
  onActivate,
  onScrub,
  hasHold,
  onHold,
}: IUseBarPointerOptions) {
  const gesture = useRef<IBarGesture | null>(null);
  const consumed = useRef(false);
  const timer = useLongPressTimer();

  // The cells' own boxes, never the bar's width over five: the pill has inner
  // padding, so dividing skews every boundary. Read once, since the pill is
  // fixed and cannot move mid-gesture.
  function measure(pill: HTMLElement): HTMLElement[] {
    return Array.from(pill.querySelectorAll<HTMLElement>("[data-nav-cell]"));
  }

  function resolveIndex(x: number, y: number): number | null {
    const current = gesture.current;
    if (!current) return null;

    const { pillRect } = current;
    if (y < pillRect.top - VERTICAL_SLOP_PX) return null;
    if (y > pillRect.bottom + VERTICAL_SLOP_PX) return null;

    const index = current.cellRects.findIndex(
      (rect) => x >= rect.left && x <= rect.right,
    );

    return index === -1 ? null : index;
  }

  // Explicit release on both end and abort: leaning on the implicit release left
  // captures outliving their gesture, which read as one tab activating another.
  function endGesture() {
    const current = gesture.current;
    gesture.current = null;
    timer.stop();
    onScrub(null);

    if (current?.pill.hasPointerCapture(current.pointerId)) {
      current.pill.releasePointerCapture(current.pointerId);
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    const width = window.innerWidth;
    // Never compete with the iOS back-swipe or the home-indicator gesture.
    if (
      event.clientX < BAR_EDGE_EXCLUSION_PX ||
      event.clientX > width - BAR_EDGE_EXCLUSION_PX
    ) {
      return;
    }

    const pill = event.currentTarget;
    const cells = measure(pill);
    consumed.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      pill,
      cells,
      cellRects: cells.map((cell) => cell.getBoundingClientRect()),
      pillRect: pill.getBoundingClientRect(),
      startIndex: -1,
      startX: event.clientX,
      startY: event.clientY,
    };

    const index = resolveIndex(event.clientX, event.clientY);
    if (index === null) {
      gesture.current = null;
      return;
    }

    gesture.current.startIndex = index;
    pill.setPointerCapture(event.pointerId);
    onScrub(index);

    // The lock is enforced here as well as on the element, since a disabled
    // button does not stop a bar-level handler from resolving its cell.
    if (!hasHold(index)) return;

    timer.start(cells[index] ?? null, () => {
      consumed.current = true;
      onHold(index);
    });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current) return;

    const index = resolveIndex(event.clientX, event.clientY);
    const travelled = Math.hypot(
      event.clientX - current.startX,
      event.clientY - current.startY,
    );

    // Past the threshold the press is a drag or a scroll, and leaving the cell
    // means the thumb is now scrubbing rather than holding.
    if (travelled > HOLD_CANCEL_PX || index !== current.startIndex) {
      timer.stop();
    }

    onScrub(index);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!gesture.current) return;

    const index = resolveIndex(event.clientX, event.clientY);
    endGesture();

    // A fired hold swallows the activation the release would otherwise make.
    if (consumed.current || index === null) return;

    onActivate(index);
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: endGesture,
    onLostPointerCapture: endGesture,
  };
}
