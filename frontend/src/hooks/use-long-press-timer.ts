"use client";

import { useEffect, useRef } from "react";
import {
  HOLD_DRAIN_MS,
  HOLD_GATE_MS,
  HOLD_RING_MS,
} from "@/constants/gestures";
import { clamp } from "@/utils/generic";

const PROGRESS_PROPERTY = "--long-press-progress";

export interface ILongPressTimer {
  /** Opens the silent gate; `target` is where the ring's progress is written */
  start: (target: HTMLElement | null, onFire: () => void) => void;
  /** Abandons the hold and drains whatever ring is showing */
  stop: () => void;
}

/**
 * Binds no DOM events, so the bar drives it from the pointer path it already owns
 * while a product card drives it from its own handlers.
 *
 * The gate is a real gate, not a clamp: before it elapses there is no frame loop
 * and no progress written anywhere. A deliberate tap runs 150-200ms, so an
 * earlier threshold flashed a sliver of ring on every single tap.
 */
export default function useLongPressTimer(): ILongPressTimer {
  const gate = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const element = useRef<HTMLElement | null>(null);

  function clearTimers() {
    if (gate.current !== null) window.clearTimeout(gate.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);

    gate.current = null;
    frame.current = null;
  }

  // Written straight to the element, so neither filling nor draining the ring
  // re-renders a subtree once per frame.
  function ramp(
    target: HTMLElement,
    duration: number,
    valueAt: (fraction: number) => number,
    onDone: () => void,
  ) {
    const startedAt = performance.now();

    function tick() {
      const fraction = clamp((performance.now() - startedAt) / duration, 0, 1);
      target.style.setProperty(PROGRESS_PROPERTY, String(valueAt(fraction)));

      if (fraction < 1) {
        frame.current = requestAnimationFrame(tick);
        return;
      }

      frame.current = null;
      onDone();
    }

    tick();
  }

  function start(target: HTMLElement | null, onFire: () => void) {
    clearTimers();
    element.current = target;
    target?.style.removeProperty(PROGRESS_PROPERTY);

    gate.current = window.setTimeout(() => {
      gate.current = null;
      if (!target) return;

      ramp(
        target,
        HOLD_RING_MS,
        (fraction) => fraction,
        () => {
          element.current = null;
          target.style.removeProperty(PROGRESS_PROPERTY);
          onFire();
        },
      );
    }, HOLD_GATE_MS);
  }

  function stop() {
    clearTimers();

    const target = element.current;
    element.current = null;
    if (!target) return;

    const from = Number(target.style.getPropertyValue(PROGRESS_PROPERTY));
    if (!from) {
      target.style.removeProperty(PROGRESS_PROPERTY);
      return;
    }

    ramp(
      target,
      HOLD_DRAIN_MS,
      (fraction) => from * (1 - fraction),
      () => target.style.removeProperty(PROGRESS_PROPERTY),
    );
  }

  useEffect(() => {
    return () => {
      clearTimers();
      element.current = null;
    };
  }, []);

  return { start, stop };
}
