import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import {
  dropSharedCodes,
  stanicCodeFor,
} from "@/lib/store-locations/sources/stanic-store-codes";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

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
});

export const stanicLocator: IStoreLocator = {
  chain: "stanic",

  async fetchStores(signal) {
    const payload = await fetchJson(SEARCH_URL, signal);

    if (!Array.isArray(payload))
      throw new Error("Stanić store list is not an array");

    // Codes are settled before rows with bad coordinates drop out, so a
    // title listed twice stays ambiguous even if one twin is unusable.
    const rows = dropSharedCodes(
      payload.flatMap((raw) => {
        const parsed = storeSchema.safeParse(raw);

        return parsed.success
          ? [{ ...parsed.data, code: stanicCodeFor(parsed.data.store) }]
          : [];
      }),
    );

    const uncoded = rows.filter((row) => !row.code).map((row) => row.store);

    if (uncoded.length > 0) {
      console.warn(
        `[store-locations] Stanić stores without a code: ${uncoded.join("; ")}`,
      );
    }

    const stores: ILocatorStore[] = [];

    for (const { code, address, city, zip, lat, lng } of rows) {
      const coordinates = sanitizeCoordinates(lat, lng);

      if (!coordinates) continue;

      stores.push({
        code,
        address,
        city: city || undefined,
        // The site writes Zagreb's postcode as "1000" on one store.
        zipcode: zip && /^\d{5}$/.test(zip) ? zip : undefined,
        ...coordinates,
      });
    }

    return stores;
  },
};
