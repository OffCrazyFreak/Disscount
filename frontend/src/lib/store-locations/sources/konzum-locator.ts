import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { parseKonzumHours } from "@/lib/store-hours/sources/konzum-hours";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { fetchJson } from "@/lib/store-locations/http";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

const URL = "https://trgovine.konzum.hr/api/locations/";

const responseSchema = z.object({
  locations: z.array(
    z.object({
      address: z.string(),
      work_hours: z.string().nullish(),
      coordinates: z
        .object({
          lat: z.number().nullish(),
          lng: z.number().nullish(),
        })
        .nullish(),
    }),
  ),
});

// The street may contain commas, so only the last segment is the zip and city.
function splitAddress(raw: string) {
  const cut = raw.lastIndexOf(",");
  const street = cut === -1 ? raw : raw.slice(0, cut);
  const tail = cut === -1 ? "" : raw.slice(cut + 1).trim();
  const match = /^(\d{5})\s+(.+)$/.exec(tail);

  return {
    address: street.trim(),
    zipcode: match?.[1],
    city: match ? match[2].trim() : tail || undefined,
  };
}

export const konzumLocator: IStoreLocator = {
  chain: "konzum",

  async fetchStores(signal) {
    const { locations } = responseSchema.parse(await fetchJson(URL, signal));
    const stores: ILocatorStore[] = [];
    const { date: today } = zagrebClock(new Date());

    for (const location of locations) {
      const point = sanitizeCoordinates(
        location.coordinates?.lat,
        location.coordinates?.lng,
      );

      if (!point) continue;

      stores.push({
        ...splitAddress(location.address),
        hours: location.work_hours
          ? parseKonzumHours(location.work_hours, today)
          : undefined,
        ...point,
      });
    }

    return stores;
  },
};
