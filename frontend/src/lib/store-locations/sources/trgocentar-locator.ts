import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { parseTrgocentarWeek } from "@/lib/store-hours/sources/trgocentar-hours";
import { fetchText } from "@/lib/store-locations/http";
import { decodeEntities } from "@/utils/strings";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

const SOURCE_URL = "https://trgocentar.com/prodajna-mjesta/";

const mapSchema = z.object({
  places: z.array(
    z.object({
      // Centred HTML: title paragraph, then "Street 1, Place", then opening hours.
      address: z.string(),
      latitude: z.string(),
      longitude: z.string(),
    }),
  ),
});

function extractMap(html: string): unknown {
  const match = /data-adv-maps="([^"]*)"/.exec(html);

  if (!match) throw new Error("Trgocentar page has no map data");

  return JSON.parse(decodeEntities(match[1]));
}

// The second paragraph is the postal line, e.g. "Hum Lug 80, Zabok".
function splitPostalLine(html: string) {
  const paragraphs = [...html.matchAll(/<p[^>]*>(.*?)<\/p>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").trim(),
  );
  const line = paragraphs[1] ?? "";
  const cut = line.lastIndexOf(",");

  if (cut === -1) return null;

  return {
    address: line.slice(0, cut).trim(),
    city: line.slice(cut + 1).trim(),
  };
}

// No `code`: the page numbers shops ("BR. 3") differently from cijene-api's P120.
export const trgocentarLocator: IStoreLocator = {
  chain: "trgocentar",

  async fetchStores(signal) {
    const { places } = mapSchema.parse(
      extractMap(await fetchText(SOURCE_URL, signal)),
    );
    const result: ILocatorStore[] = [];

    for (const place of places) {
      const coordinates = sanitizeCoordinates(
        parseFloat(place.latitude),
        parseFloat(place.longitude),
      );
      const postal = splitPostalLine(place.address);

      if (!coordinates || !postal) continue;

      result.push({
        ...postal,
        hours: parseTrgocentarWeek(place.address),
        ...coordinates,
      });
    }

    return result;
  },
};
