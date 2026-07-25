/** Measured from the press, so the ring fills over whatever the debounce leaves */
export const LONG_PRESS_MS = 450;

/** Past this, a press is a drag or a scroll, so the gesture is abandoned */
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Nothing at all happens for this long, which is past a deliberate tap, so a tap
 * never flashes the ring. Only a press that outlives it gets feedback, and that
 * is what teaches the gesture without a coachmark.
 */
export const LONG_PRESS_DEBOUNCE_MS = 200;

export interface ILongPressTimer {
  start: () => void;
  cancel: () => void;
  isPending: () => boolean;
  hasFired: () => boolean;
}

interface ICreateLongPressTimerOptions {
  onFire: () => void;
  /** Receives 0 to 1, and only once the debounce has elapsed */
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
  let timeout: number | null = null;
  let frame: number | null = null;
  let fired = false;

  function clear() {
    if (timeout !== null) window.clearTimeout(timeout);
    if (frame !== null) cancelAnimationFrame(frame);

    timeout = null;
    frame = null;
  }

  function ramp() {
    const startedAt = performance.now();
    const duration = LONG_PRESS_MS - LONG_PRESS_DEBOUNCE_MS;

    function tick() {
      onProgress(Math.min(1, (performance.now() - startedAt) / duration));
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    timeout = window.setTimeout(() => {
      fired = true;
      clear();
      onProgress(0);
      onFire();
    }, duration);
  }

  function start() {
    clear();
    fired = false;

    // The debounce holds the only pending timer, so isPending stays true through
    // it and a drag can still abandon the gesture before anything is drawn.
    timeout = window.setTimeout(ramp, LONG_PRESS_DEBOUNCE_MS);
  }

  function cancel() {
    clear();
    onProgress(0);
  }

  return {
    start,
    cancel,
    isPending: () => timeout !== null,
    hasFired: () => fired,
  };
}
