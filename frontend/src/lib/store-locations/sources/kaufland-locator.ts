import "server-only";

import { z } from "zod";

import { fetchPlacedRows } from "@/lib/store-locations/sources/fetch-placed-rows";
import type { IStoreLocator } from "@/lib/store-locations/types";

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
    const placed = await fetchPlacedRows(URL, storeSchema, signal, (row) => [
      row.lat,
      row.lng,
    ]);

    return placed.map(({ row, point }) => ({
      // "HR3430" is cijene-api store code "3430" (53 of 53 verified).
      code: /^HR(\d+)$/.exec(row.n)?.[1],
      address: row.sn.replace(/\s+/g, " ").trim(),
      city: row.t?.trim() || undefined,
      zipcode: row.pc?.trim() || undefined,
      ...point,
    }));
  },
};
