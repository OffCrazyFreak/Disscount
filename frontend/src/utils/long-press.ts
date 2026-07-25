import { HOLD_FIRE_MS, HOLD_GATE_MS, HOLD_RING_MS } from "@/constants/gestures";

export interface IHoldTimer {
  cancel: () => void;
}

interface IHoldTimerOptions {
  onFire: () => void;
  onProgress: (progress: number) => void;
}

/**
 * Framework-free so the bar and a product card cannot drift on timing.
 *
 * Until the gate elapses nothing is scheduled but two timeouts: no animation
 * frames, no progress written, so a press shorter than a deliberate tap draws
 * nothing at all.
 */
export default function startHoldTimer({
  onFire,
  onProgress,
}: IHoldTimerOptions): IHoldTimer {
  let frame = 0;
  let rampStart = 0;

  function stop() {
    clearTimeout(gate);
    clearTimeout(fire);
    cancelAnimationFrame(frame);
    onProgress(0);
  }

  function ramp(now: number) {
    rampStart ||= now;

    const progress = Math.min(1, (now - rampStart) / HOLD_RING_MS);
    onProgress(progress);

    if (progress < 1) frame = requestAnimationFrame(ramp);
  }

  const gate = setTimeout(() => {
    frame = requestAnimationFrame(ramp);
  }, HOLD_GATE_MS);

  const fire = setTimeout(() => {
    stop();
    onFire();
  }, HOLD_FIRE_MS);

  return { cancel: stop };
}
