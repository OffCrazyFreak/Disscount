"use client";

import { useRef, type PointerEvent } from "react";

import { SWIPE_AXIS_RATIO, SWIPE_COMMIT_PX } from "@/constants/gestures";

interface IUseSwipeHorizontalOptions {
  // Finger travels left, so the content moves forward.
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled?: boolean;
}

/**
 * Pointer props that fire once per gesture on a deliberate horizontal swipe.
 *
 * Touch and pen only: a mouse drag stays free to select text. Resolved on
 * pointer up rather than mid-move, so a swipe never competes with the vertical
 * scroll of the container it sits in, and only when the horizontal travel
 * clearly out-measures the vertical drift.
 */
export default function useSwipeHorizontal({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: IUseSwipeHorizontalOptions) {
  const start = useRef<{ x: number; y: number } | null>(null);

  if (!enabled) return {};

  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") return;
      start.current = { x: event.clientX, y: event.clientY };
    },

    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;

      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;

      if (Math.abs(dx) < SWIPE_COMMIT_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) return;

      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },

    onPointerCancel: () => {
      start.current = null;
    },
  };
}
