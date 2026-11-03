import "server-only";

import { z } from "zod";

import { parseStanicHours } from "@/lib/store-hours/sources/stanic-hours";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import { stanicCodeReader } from "@/lib/store-locations/sources/stanic-store-codes";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

// WP Store Locator's search, centred on Croatia with a radius covering it all.
const SEARCH_URL =
  "https://diskont.hr/wp-admin/admin-ajax.php?action=store_search&lat=45.8&lng=16&max_results=500&search_radius=500&autoload=1";

const storeSchema = z.object({
  store: z.string(),
  address: z.string(),
  city: z.string().nullish(),
  zip: z.string().nullish(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  hours: z.string().nullish(),
  url: z.string().nullish(),
});

export const stanicLocator: IStoreLocator = {
  chain: "stanic",

  async fetchStores(signal) {
    const payload = await fetchJson(SEARCH_URL, signal);

    if (!Array.isArray(payload))
      throw new Error("Stanić store list is not an array");

    const codeFor = stanicCodeReader(payload);
    const rows = payload.flatMap((raw) => {
      const parsed = storeSchema.safeParse(raw);

      return parsed.success
        ? [{ ...parsed.data, code: codeFor(parsed.data.store) }]
        : [];
    });

    const uncoded = rows.filter((row) => !row.code).map((row) => row.store);

    if (uncoded.length > 0) {
      console.warn(
        `[store-locations] Stanić stores without a code: ${uncoded.join("; ")}`,
      );
    }

    const stores: ILocatorStore[] = [];

    for (const { code, address, city, zip, lat, lng, hours, url } of rows) {
      const coordinates = sanitizeCoordinates(lat, lng);

      if (!coordinates) continue;

      stores.push({
        code,
        address,
        city: city || undefined,
        // The site writes Zagreb's postcode as "1000" on one store.
        zipcode: zip && /^\d{5}$/.test(zip) ? zip : undefined,
        hours: hours ? parseStanicHours(hours) : undefined,
        pageUrl: url?.startsWith("https://diskont.hr/") ? url : undefined,
        ...coordinates,
      });
    }

    return stores;
  },
};
