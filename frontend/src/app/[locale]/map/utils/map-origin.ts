import type { IGpsPosition } from "@/app/[locale]/map/hooks/use-geolocation";
import { ILatLon } from "@/app/[locale]/map/utils/distance";

// Android and iOS "approximate" grants are 2 km or coarser: that pins a town,
// not a street, so a kilometre figure would claim more than it knows.
const PRECISE_WITHIN_M = 2_000;

interface IIpGuess extends ILatLon {
  city: string | null;
}

export interface IMapOrigin {
  /** What the list is sorted from, or null for alphabetical. */
  origin: ILatLon | null;
  kind: "gps" | "ip" | null;
  showDistances: boolean;
  /** The town the IP guess named, for the "approximate" note. */
  ipCity: string | null;
}

/**
 * GPS beats everything. Without it the IP guess sorts the list, unless the
 * user pinned a place: that is their own choice and beats a guess.
 */
export function resolveMapOrigin(
  gps: IGpsPosition | null,
  ip: IIpGuess | null,
  hasPinnedPlace: boolean,
): IMapOrigin {
  if (gps) {
    return {
      origin: { lat: gps.lat, lon: gps.lon },
      kind: "gps",
      showDistances: gps.accuracy <= PRECISE_WITHIN_M,
      ipCity: null,
    };
  }

  if (ip && !hasPinnedPlace) {
    return {
      origin: { lat: ip.lat, lon: ip.lon },
      kind: "ip",
      showDistances: false,
      ipCity: ip.city,
    };
  }

  return { origin: null, kind: null, showDistances: false, ipCity: null };
}
