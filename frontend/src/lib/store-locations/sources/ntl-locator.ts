import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const PAGE_URL = "https://ntl.hr/prodajna-mjesta";

const storeSchema = z.object({
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

      if (!coordinates) continue;

      stores.push({
        address: parsed.data.street,
        ...splitPlace(parsed.data.place),
        ...coordinates,
      });
    }

    return stores;
  },
};
