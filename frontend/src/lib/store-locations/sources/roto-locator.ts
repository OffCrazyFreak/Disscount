import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchJson } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const SOURCE_URL = "https://rotodinamic.hr/poslovnica/poslovnice.json";

const siteSchema = z.object({
  sifra: z.string(),
  lat: z.string(),
  // The feed really spells longitude "lang".
  lang: z.string(),
  adresa: z.string(),
});

const responseSchema = z.object({
  vpc: z.array(siteSchema),
  mpc: z.array(siteSchema),
});

// "Kovinska 1, 10000 Zagreb" -> street, zip, city
function splitAddress(raw: string) {
  const cut = raw.lastIndexOf(",");

  if (cut === -1) return { address: raw.trim() };

  const tail = /^(\d{5})\s+(.+)$/.exec(raw.slice(cut + 1).trim());

  return {
    address: raw.slice(0, cut).trim(),
    zipcode: tail?.[1],
    city: tail?.[2],
  };
}

export const rotoLocator: IStoreLocator = {
  chain: "roto",

  async fetchStores(signal) {
    const { vpc, mpc } = responseSchema.parse(
      await fetchJson(SOURCE_URL, signal),
    );
    const result: ILocatorStore[] = [];

    for (const site of [...vpc, ...mpc]) {
      const coordinates = sanitizeCoordinates(
        Number(site.lat),
        Number(site.lang),
      );

      if (!coordinates) continue;

      // `sifra` is the store code cijene-api uses (D09, M02).
      result.push({
        code: site.sifra,
        ...splitAddress(site.adresa),
        ...coordinates,
      });
    }

    return result;
  },
};
