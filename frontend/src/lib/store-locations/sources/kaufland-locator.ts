import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const URL = "https://www.kaufland.hr/.klstorefinder.json";

// The feed publishes coordinates as strings.
const storeSchema = z.object({
  n: z.string(),
  sn: z.string(),
  pc: z.string().nullish(),
  t: z.string().nullish(),
  lat: z.coerce.number().nullish(),
  lng: z.coerce.number().nullish(),
});

export const kauflandLocator: IStoreLocator = {
  chain: "kaufland",

  async fetchStores(signal) {
    const rows = z.array(storeSchema).parse(await fetchJson(URL, signal));
    const stores: ILocatorStore[] = [];

    for (const row of rows) {
      const point = sanitizeCoordinates(row.lat, row.lng);

      if (!point) continue;

      // "HR3430" is cijene-api store code "3430" (53 of 53 verified).
      const code = /^HR(\d+)$/.exec(row.n)?.[1];

      stores.push({
        code,
        address: row.sn.replace(/\s+/g, " ").trim(),
        city: row.t?.trim() || undefined,
        zipcode: row.pc?.trim() || undefined,
        ...point,
      });
    }

    return stores;
  },
};
