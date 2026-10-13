import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

// The site runs the Agile Store Locator WordPress plugin, whose public AJAX
// action returns every premises, petrol stations and workshops included.
// Unmatched extras are harmless: stores are matched by address, not listed.
const URL =
  "https://trgovina-krk.hr/wp-admin/admin-ajax.php?action=asl_load_stores&load_all=1&layout=1";

const rowSchema = z.object({
  street: z.string(),
  city: z.string(),
  postal_code: z.string().nullish(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

export const trgovinaKrkLocator: IStoreLocator = {
  chain: "trgovina-krk",

  async fetchStores(signal) {
    const rows = z.array(z.unknown()).parse(await fetchJson(URL, signal));
    const stores: ILocatorStore[] = [];

    for (const row of rows) {
      const parsed = rowSchema.safeParse(row);
      if (!parsed.success) continue;

      const coordinates = sanitizeCoordinates(parsed.data.lat, parsed.data.lng);
      if (!coordinates || !parsed.data.street.trim()) continue;

      stores.push({
        address: parsed.data.street.trim(),
        city: parsed.data.city.trim(),
        zipcode: parsed.data.postal_code?.trim() || undefined,
        ...coordinates,
      });
    }

    return stores;
  },
};
