import { clamp } from "@/utils/generic";

/** |dx| works for both facings, because scaleX(-1) inverts the rendered rotation. */
export function cursorTiltDeg(dx: number, dy: number, maxDeg: number): number {
  const angle = (Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
  return clamp(angle, -maxDeg, maxDeg);
}
