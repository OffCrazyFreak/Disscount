import {
  HOLD_DRAIN_MS,
  HOLD_GATE_MS,
  HOLD_RING_MS,
} from "@/constants/gestures";
import { clamp } from "@/utils/generic";

export interface ILongPressTimer {
  start: () => void;
  cancel: () => void;
  dispose: () => void;
  isPending: () => boolean;
  hasFired: () => boolean;
}

interface ICreateLongPressTimerOptions {
  onFire: () => void;
  /** Receives 0 to 1, and only once the gate has elapsed */
  onProgress: (fraction: number) => void;
}

/**
 * Framework-free so the bottom bar and the product cards share one gesture
 * implementation despite owning very different pointer streams.
 */
export function createLongPressTimer({
  onFire,
  onProgress,
}: ICreateLongPressTimerOptions): ILongPressTimer {
  let gate: number | null = null;
  let frame: number | null = null;
  let pending = false;
  let fired = false;
  let progress = 0;

  function clear() {
    if (gate !== null) window.clearTimeout(gate);
    if (frame !== null) cancelAnimationFrame(frame);

    gate = null;
    frame = null;
  }

  function emit(fraction: number) {
    progress = fraction;
    onProgress(fraction);
  }

  function ramp(
    duration: number,
    valueAt: (elapsed: number) => number,
    onDone: () => void,
  ) {
    const startedAt = performance.now();

    function tick() {
      const elapsed = clamp((performance.now() - startedAt) / duration, 0, 1);
      emit(valueAt(elapsed));

      if (elapsed < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }

      frame = null;
      onDone();
    }

    frame = requestAnimationFrame(tick);
  }

  function start() {
    clear();
    fired = false;
    pending = true;
    emit(0);

    // A real gate, not a clamp: nothing is scheduled and nothing is drawn until
    // it elapses, which is what keeps an ordinary tap silent.
    gate = window.setTimeout(() => {
      gate = null;

      ramp(
        HOLD_RING_MS,
        (elapsed) => elapsed,
        () => {
          pending = false;
          fired = true;
          emit(0);
          onFire();
        },
      );
    }, HOLD_GATE_MS);
  }

  /** Retracts whatever the ring reached, so an abandoned hold reads as released */
  function cancel() {
    clear();
    pending = false;

    if (!progress) return emit(0);

    const from = progress;

    ramp(
      HOLD_DRAIN_MS,
      (elapsed) => from * (1 - elapsed),
      () => emit(0),
    );
  }

  /**
   * For unmount, where cancel() would be wrong: it starts a drain, so the ramp
   * keeps scheduling frames and writing to a detached element for HOLD_DRAIN_MS.
   */
  function dispose() {
    clear();
    pending = false;
    progress = 0;
  }

  return {
    start,
    cancel,
    dispose,
    isPending: () => pending,
    hasFired: () => fired,
  };
}
