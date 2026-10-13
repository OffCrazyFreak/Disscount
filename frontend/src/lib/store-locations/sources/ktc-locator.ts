import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const SOURCE_URL = "https://www.ktc.hr/";

// Type 2 is "Trgovine"; the locator also lists pharmacies, restaurants and fuel.
const SHOP_TYPE = "2";

const markersSchema = z.array(
  z.object({
    Type: z.string(),
    Address: z.string(),
    City: z.string(),
    Zip: z.string(),
    Mail: z.string(),
    // The feed swaps the names: X is latitude, Y is longitude.
    PositionX: z.string(),
    PositionY: z.string(),
  }),
);

function extractMarkers(html: string): unknown {
  const match = /var markers = (\[[^\n]*\])\s*;/.exec(html);

  if (!match) throw new Error("KTC page has no markers array");

  return JSON.parse(match[1]);
}

export const ktcLocator: IStoreLocator = {
  chain: "ktc",

  async fetchStores(signal) {
    const markers = markersSchema.parse(
      extractMarkers(await fetchText(SOURCE_URL, signal)),
    );
    const result: ILocatorStore[] = [];

    for (const marker of markers) {
      if (marker.Type !== SHOP_TYPE) continue;

      const coordinates = sanitizeCoordinates(
        parseFloat(marker.PositionX),
        parseFloat(marker.PositionY),
      );

      if (!coordinates) continue;

      // "vgorica-83@ktc.hr" is store 83, which cijene-api calls PJPJ83.
      const number = /-(\d+)@/.exec(marker.Mail)?.[1];

      result.push({
        code: number ? `PJPJ${Number(number)}` : undefined,
        address: marker.Address,
        city: marker.City,
        zipcode: marker.Zip || undefined,
        ...coordinates,
      });
    }

    return result;
  },
};
