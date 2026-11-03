import "server-only";

import { z } from "zod";

import { parseKauflandHours } from "@/lib/store-hours/sources/kaufland-hours";
import { fetchPlacedRows } from "@/lib/store-locations/sources/fetch-placed-rows";
import type { IStoreLocator } from "@/lib/store-locations/store-location-types";

const URL = "https://www.kaufland.hr/.klstorefinder.json";

// The feed publishes coordinates as strings.
const storeSchema = z.object({
  n: z.string(),
  sn: z.string(),
  pc: z.string().nullish(),
  t: z.string().nullish(),
  lat: z.coerce.number().nullish(),
  lng: z.coerce.number().nullish(),
  wod: z.array(z.string()).catch([]),
  sod: z.array(z.string()).catch([]),
  friendlyUrl: z.string().nullish(),
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
      hours: row.wod.length ? parseKauflandHours(row.wod, row.sod) : undefined,
      pageUrl: /^[\w-]+$/.test(row.friendlyUrl ?? "")
        ? `https://www.kaufland.hr/usluge/poslovnica/${row.friendlyUrl}.html`
        : undefined,
      ...point,
    }));
  },
};
