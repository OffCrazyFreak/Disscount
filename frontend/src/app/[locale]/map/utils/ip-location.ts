import "server-only";

import { isInCroatia } from "@/lib/store-locations/croatia-bounds";

export interface IIpLocation {
  lat: number;
  lon: number;
}

// About a kilometre: enough to centre and sort, no finer than the guess is.
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Only a guess inside Croatia is used; forging these headers only moves the sender's own map. */
export function readIpLocation(headers: Headers): IIpLocation | null {
  const latHeader = headers.get("cf-iplatitude");
  const lonHeader = headers.get("cf-iplongitude");

  if (!latHeader || !lonHeader) return null;

  const lat = Number(latHeader);
  const lon = Number(lonHeader);

  if (!isInCroatia(lat, lon)) return null;

  return { lat: round(lat), lon: round(lon) };
}
