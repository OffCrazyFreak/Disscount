import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const URL = "https://www.spar.hr/lokacije/_jcr_content.stores.v2.html";

const storeSchema = z.object({
  address: z.string(),
  city: z.string().nullish(),
  zipCode: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

export const sparLocator: IStoreLocator = {
  chain: "spar",

  async fetchStores(signal) {
    const rows = z.array(storeSchema).parse(await fetchJson(URL, signal));
    const stores: ILocatorStore[] = [];

    for (const row of rows) {
      const point = sanitizeCoordinates(row.latitude, row.longitude);

      if (!point) continue;

      stores.push({
        address: row.address.replace(/\s+/g, " ").trim(),
        city: row.city?.trim() || undefined,
        zipcode: row.zipCode?.trim() || undefined,
        ...point,
      });
    }

    return stores;
  },
};
