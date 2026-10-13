import "server-only";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const PAGE_URL = "https://www.boso.hr/poslovnice/";

// The page builds its Google map from inline script, one marker per store:
// the position, then an info template with the name and "Adresa: street, zip, city".
const MARKER_PATTERN =
  /position:\s*\{lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)\}[\s\S]*?<h5>(.*?)<\/h5>[\s\S]*?Adresa:\s*(.*?)<\/small>/g;

function parseAddress(line: string) {
  const parts = line
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== "croatia");

  const zipIndex = parts.findIndex((part) => /^\d{5}$/.test(part));

  if (zipIndex < 1) return { address: parts[0] ?? "", city: parts[1] };

  return {
    address: parts.slice(0, zipIndex).join(", "),
    zipcode: parts[zipIndex],
    city: parts[zipIndex + 1],
  };
}

export const bosoLocator: IStoreLocator = {
  chain: "boso",

  async fetchStores(signal) {
    const html = await fetchText(PAGE_URL, signal);
    const stores: ILocatorStore[] = [];

    for (const match of html.matchAll(MARKER_PATTERN)) {
      const coordinates = sanitizeCoordinates(
        Number(match[1]),
        Number(match[2]),
      );
      const parsed = parseAddress(match[4]);

      if (!coordinates || !parsed.address) continue;

      stores.push({ ...parsed, ...coordinates });
    }

    return stores;
  },
};
