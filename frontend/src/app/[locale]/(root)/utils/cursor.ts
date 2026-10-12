import { clamp } from "@/utils/generic";

/**
 * Tilt (in degrees) that aims a horizontally-flippable element at the cursor,
 * given the cursor's offset from the element's center. Using |dx| makes the
 * same value work for both facings: mirroring via scaleX(-1) inverts the
 * rendered rotation, so the front always noses toward the cursor.
 */
export function cursorTiltDeg(dx: number, dy: number, maxDeg: number): number {
  const angle = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
  return clamp(angle, -maxDeg, maxDeg);
}
