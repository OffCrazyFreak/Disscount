import "server-only";

import { z } from "zod";

import { fetchPlacedRows } from "@/lib/store-locations/sources/fetch-placed-rows";
import type { IStoreLocator } from "@/lib/store-locations/types";

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
    const placed = await fetchPlacedRows(URL, storeSchema, signal, (row) => [
      row.latitude,
      row.longitude,
    ]);

    return placed.map(({ row, point }) => ({
      address: row.address.replace(/\s+/g, " ").trim(),
      city: row.city?.trim() || undefined,
      zipcode: row.zipCode?.trim() || undefined,
      ...point,
    }));
  },
};
