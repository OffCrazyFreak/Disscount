import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const SOURCE_URL = "https://www.eurospin.hr/nase-poslovnice/";

const storesSchema = z.array(
  z.object({
    lat: z.number(),
    lng: z.number(),
    // "Street 1<br>47250, Duga Resa KA<div ...>"
    content: z.string(),
    brochure: z.object({ url: z.string() }).optional(),
  }),
);

function extractStores(html: string): unknown {
  const match = /var stores = (\[[^\n]*\])\s*;/.exec(html);

  if (!match) throw new Error("Eurospin page has no stores array");

  return JSON.parse(match[1]);
}

export const eurospinLocator: IStoreLocator = {
  chain: "eurospin",

  async fetchStores(signal) {
    const stores = storesSchema.parse(
      extractStores(await fetchText(SOURCE_URL, signal)),
    );
    const result: ILocatorStore[] = [];

    for (const store of stores) {
      const coordinates = sanitizeCoordinates(store.lat, store.lng);
      const [address, place] = store.content.split("<div")[0].split("<br>");

      if (!coordinates || !address) continue;

      // "52100, Pula PU": the trailing two letters are the county plate code.
      const parts = /^(\d{5}),\s*(.+?)(?:\s+[A-Z]{2})?$/.exec(
        place?.trim() ?? "",
      );

      result.push({
        // The brochure link carries the same store number cijene-api uses.
        code: /codice_pv=(\d+)/.exec(store.brochure?.url ?? "")?.[1],
        address: address.trim(),
        zipcode: parts?.[1],
        city: parts?.[2],
        ...coordinates,
      });
    }

    return result;
  },
};
