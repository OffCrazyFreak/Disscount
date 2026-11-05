import type { IGpsPosition } from "@/hooks/use-geolocation";
import { ILatLon } from "@/utils/distance";

// Android and iOS "approximate" grants are 2 km or coarser: that pins a town,
// not a street, so a kilometre figure would claim more than it knows.
const PRECISE_WITHIN_M = 2_000;

export interface IMapOrigin {
  /** What the list is sorted from, or null for alphabetical. */
  origin: ILatLon | null;
  showDistances: boolean;
}

/**
 * GPS beats everything, then the guess a near-me tap fell back to. Without
 * either, a picked or saved town sorts the list: that is the user's own
 * choice and beats the IP guess. None of these is precise enough for a
 * kilometre figure.
 */
export function resolveMapOrigin(
  gps: IGpsPosition | null,
  tapGuess: ILatLon | null,
  town: ILatLon | null,
  ip: ILatLon | null,
): IMapOrigin {
  if (gps) {
    return {
      origin: { lat: gps.lat, lon: gps.lon },
      showDistances: gps.accuracy <= PRECISE_WITHIN_M,
    };
  }

  const fallback = tapGuess ?? town ?? ip;

  return {
    origin: fallback ? { lat: fallback.lat, lon: fallback.lon } : null,
    showDistances: false,
  };
}
