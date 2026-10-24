import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const PAGE_URL = "https://ntl.hr/prodajna-mjesta";

const storeSchema = z.object({
  title: z.string().optional(),
  street: z.string(),
  place: z.string().optional(),
  position: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
  }),
});

// The page hands its map script the whole store list as a JS literal.
const LOCATIONS_PATTERN =
  /var locations = (\[[\s\S]*?\]);\s*(?:\/\*|<\/script>|var )/;

function parseLocations(html: string): unknown[] {
  const literal = LOCATIONS_PATTERN.exec(html)?.[1];

  if (!literal) throw new Error("NTL page has no locations array");

  const parsed: unknown = JSON.parse(literal);

  if (!Array.isArray(parsed)) throw new Error("NTL locations is not an array");

  return parsed;
}

// "place" looks like "10290 Zaprešić": postcode first, then the settlement.
function splitPlace(place: string | undefined) {
  const match = /^(\d{5})\s+(.+)$/.exec(place?.trim() ?? "");

  return match
    ? { zipcode: match[1], city: match[2] }
    : { zipcode: undefined, city: place?.trim() || undefined };
}

// "NTL TRGOVINA BR. 350". Only three and four digit numbers follow the code
// scheme; one and two digit ones ("BR. 33") belong to stores coded otherwise.
function codeSuffixOf(title: string | undefined): string | undefined {
  return /\bbr\.?\s*(\d{3,4})\s*$/i.exec(title ?? "")?.[1].padStart(4, "0");
}

// Stores ntl.hr itself pins in the wrong place, checked on 2026-10-24: CRET
// sits in the Cret near Krapina, not the one near Bizovac, TERA in Osijek,
// not Šodolovci, and the two Piškorevci stores in Đakovo, 6 km north. A
// corrected point no longer matches and is used.
const WRONG_POINTS = [
  { title: "NTL CRET", lat: 46.0978, lon: 15.838 },
  { title: "NTL TERA", lat: 45.5593, lon: 18.6784 },
  { title: "NTL REVITA 32", lat: 45.3099, lon: 18.4091 },
  { title: "NTL T- 44", lat: 45.3056, lon: 18.4101 },
];

function isWrongPoint(title: string | undefined, lat: number, lon: number) {
  return WRONG_POINTS.some(
    (wrong) =>
      wrong.title === title?.trim() &&
      Math.abs(wrong.lat - lat) < 0.001 &&
      Math.abs(wrong.lon - lon) < 0.001,
  );
}

export const ntlLocator: IStoreLocator = {
  chain: "ntl",

  async fetchStores(signal) {
    const html = await fetchText(PAGE_URL, signal);
    const stores: ILocatorStore[] = [];

    for (const raw of parseLocations(html)) {
      const parsed = storeSchema.safeParse(raw);

      if (!parsed.success) continue;

      const coordinates = sanitizeCoordinates(
        parsed.data.position.lat,
        parsed.data.position.lng,
      );

      if (
        !coordinates ||
        isWrongPoint(parsed.data.title, coordinates.lat, coordinates.lon)
      )
        continue;

      stores.push({
        codeSuffix: codeSuffixOf(parsed.data.title),
        address: parsed.data.street,
        ...splitPlace(parsed.data.place),
        ...coordinates,
      });
    }

    return stores;
  },
};
