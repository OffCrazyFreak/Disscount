import { distanceKm, ILatLon } from "@/app/[locale]/map/utils/distance";

interface IFix extends ILatLon {
  accuracy: number;
}

// Below this a watch's jitter would re-sort the list while the user stands still.
const MOVE_M = 25;

/** A watched fix is worth showing when it is sharper or the user really moved. */
export function isNewFix(last: IFix | null, next: IFix): boolean {
  if (!last) return true;
  if (next.accuracy < last.accuracy) return true;

  return distanceKm(last, next) * 1000 > Math.max(MOVE_M, next.accuracy);
}
