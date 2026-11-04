import "server-only";

import { z } from "zod";

import {
  parseSparHours,
  sparHoursFields,
} from "@/lib/store-hours/sources/spar-hours";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { fetchPlacedRows } from "@/lib/store-locations/sources/fetch-placed-rows";
import type { IStoreLocator } from "@/lib/store-locations/store-location-types";

const URL = "https://www.spar.hr/lokacije/_jcr_content.stores.v2.html";

const storeSchema = z.object({
  address: z.string(),
  city: z.string().nullish(),
  zipCode: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  ...sparHoursFields,
});

export const sparLocator: IStoreLocator = {
  chain: "spar",

  async fetchStores(signal) {
    const placed = await fetchPlacedRows(URL, storeSchema, signal, (row) => [
      row.latitude,
      row.longitude,
    ]);
    const { date: today } = zagrebClock(new Date());

    return placed.map(({ row, point }) => ({
      address: row.address.replace(/\s+/g, " ").trim(),
      city: row.city?.trim() || undefined,
      zipcode: row.zipCode?.trim() || undefined,
      hours: parseSparHours(row, today),
      // Spar's pages answer scripts with a Cloudflare challenge but open in a browser, so the link checker reports them unverified.
      pageUrl: row.pageUrl?.startsWith("/lokacije/")
        ? `https://www.spar.hr${row.pageUrl}`
        : undefined,
      ...point,
    }));
  },
};
