import "server-only";

import { fetchText } from "@/lib/store-locations/http";
import type { ILookupAddress } from "@/lib/store-locations/types";

const PAGE_URL = "https://stridon.hr/hr/distribucija/maloprodaja-4";

// The page spells Croatian letters as named entities ("&scaron;"), and
// writes č as ĉ ("Oriovĉanina").
const ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  scaron: "š",
  Scaron: "Š",
  zcaron: "ž",
  Zcaron: "Ž",
  ccaron: "č",
  Ccaron: "Č",
  cacute: "ć",
  Cacute: "Ć",
  dstrok: "đ",
  Dstrok: "Đ",
};

function cellText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(+code))
    .replace(/&(\w+);/g, (whole, name: string) => ENTITIES[name] ?? whole)
    .replace(/ĉ/g, "č")
    .replace(/Ĉ/g, "Č")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stridon's store list, keyed by upstream code: the table's "Prod. 10" is
 * cijene-api's "Prod.10". It has no coordinates, but its addresses are
 * spelled out where upstream abbreviates ("Lj.Posavskog 23, V.gorica").
 */
export async function fetchStridonAddresses(
  signal: AbortSignal,
): Promise<Map<string, ILookupAddress>> {
  const html = await fetchText(PAGE_URL, signal);
  const addresses = new Map<string, ILookupAddress>();

  for (const [, row] of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(
      ([, cell]) => cellText(cell),
    );
    const code = /^Prod\.\s*\d+$/.test(cells[0] ?? "")
      ? cells[0].replace(/\s+/g, "")
      : null;
    // "10410 Velika Gorica"
    const place = /^\d{5}\s+(.+)$/.exec(cells[2] ?? "");

    if (!code || !place || !cells[3]) continue;

    addresses.set(code, { address: cells[3], city: place[1] });
  }

  if (addresses.size === 0) throw new Error("Stridon page has no store table");

  return addresses;
}
