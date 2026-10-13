import "server-only";

import { isInCroatia } from "@/lib/store-locations/croatia-bounds";

export interface IIpLocation {
  lat: number;
  lon: number;
  city: string | null;
}

// Cloudflare sends UTF-8, but Node reads header bytes as latin1, so "Čakovec"
// arrives garbled. A value that is already proper text is left alone.
function decodeHeader(value: string | null): string | null {
  if (!value) return null;
  if (/[^\x00-\xff]/.test(value)) return value;

  const decoded = Buffer.from(value, "latin1").toString("utf8");

  return decoded.includes("\uFFFD") ? value : decoded;
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

  return {
    lat: round(lat),
    lon: round(lon),
    city: decodeHeader(headers.get("cf-ipcity")),
  };
}
