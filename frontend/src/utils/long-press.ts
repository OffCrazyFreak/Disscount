export const LONG_PRESS_MS = 450;

/** Past this, a press is a drag or a scroll, so the gesture is abandoned */
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Visible feedback starts inside Nielsen's 0.1s instant window, so an accidental
 * press shows the ring begin to fill. That is what teaches the gesture, and it is
 * why no coachmark is needed.
 */
const FEEDBACK_DELAY_MS = 120;

export interface ILongPressTimer {
  start: () => void;
  cancel: () => void;
  isPending: () => boolean;
  hasFired: () => boolean;
}

interface ICreateLongPressTimerOptions {
  onFire: () => void;
  /** Receives 0 to 1, ramping only after the feedback delay */
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

  function start() {
    clear();
    fired = false;

    const startedAt = performance.now();
    const ramp = LONG_PRESS_MS - FEEDBACK_DELAY_MS;

    function tick() {
      const elapsed = performance.now() - startedAt - FEEDBACK_DELAY_MS;

      onProgress(Math.min(1, Math.max(0, elapsed / ramp)));
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);

    timeout = window.setTimeout(() => {
      fired = true;
      clear();
      onProgress(0);
      onFire();
    }, LONG_PRESS_MS);
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
