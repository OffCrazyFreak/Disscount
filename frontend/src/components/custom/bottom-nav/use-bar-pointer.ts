"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { BAR_EDGE_EXCLUSION_PX } from "@/constants/gestures";

/** How far past the pill a thumb may stray and still count as on that cell */
const VERTICAL_SLOP_PX = 24;

interface IBarGesture {
  pointerId: number;
  pill: HTMLElement;
  cellRects: DOMRect[];
  pillRect: DOMRect;
}

export interface IUseBarPointerOptions {
  onActivate: (index: number) => void;
  onScrub: (index: number | null) => void;
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
}: IUseBarPointerOptions) {
  const gesture = useRef<IBarGesture | null>(null);

  // The cells' own boxes, never the bar's width over five: the pill has inner
  // padding, so dividing skews every boundary. Read once, since the pill is
  // fixed and cannot move mid-gesture.
  function measure(pill: HTMLElement): IBarGesture["cellRects"] {
    return Array.from(
      pill.querySelectorAll<HTMLElement>("[data-nav-cell]"),
    ).map((cell) => cell.getBoundingClientRect());
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
    gesture.current = {
      pointerId: event.pointerId,
      pill,
      cellRects: measure(pill),
      pillRect: pill.getBoundingClientRect(),
    };

    const index = resolveIndex(event.clientX, event.clientY);
    if (index === null) {
      gesture.current = null;
      return;
    }

    pill.setPointerCapture(event.pointerId);
    onScrub(index);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!gesture.current) return;

    onScrub(resolveIndex(event.clientX, event.clientY));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!gesture.current) return;

    const index = resolveIndex(event.clientX, event.clientY);
    endGesture();

    if (index !== null) onActivate(index);
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: endGesture,
    onLostPointerCapture: endGesture,
  };
}
