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

/**
 * Cloudflare's guess at where a request comes from, from its "Add visitor
 * location headers" managed transform. Only a guess inside Croatia is used;
 * anything else falls back to the whole country. A client that bypasses
 * Cloudflare can send these headers itself, which only moves its own map.
 */
export function readIpLocation(headers: Headers): IIpLocation | null {
  const latHeader = headers.get("cf-iplatitude");
  const lonHeader = headers.get("cf-iplongitude");

  if (!latHeader || !lonHeader) return null;

  const lat = Number(latHeader);
  const lon = Number(lonHeader);

  if (!isInCroatia(lat, lon)) return null;

  return { lat: round(lat), lon: round(lon) };
}
