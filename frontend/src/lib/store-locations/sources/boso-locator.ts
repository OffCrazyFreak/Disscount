import "server-only";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { weekFromLabelled } from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";
import { fetchText } from "@/lib/store-locations/http";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

const PAGE_URL = "https://www.boso.hr/poslovnice/";

// The page builds its Google map from inline script: the position, then an info template with "Adresa: street, zip, city".
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

// The hours follow the address inside the same info template literal.
function hoursAfter(html: string, from: number) {
  const end = html.indexOf("`", from);
  const lines = labelledLines(html.slice(from, end === -1 ? from : end));

  return lines.length
    ? { weekly: weekFromLabelled(lines), dated: [] }
    : undefined;
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

      stores.push({
        ...parsed,
        hours: hoursAfter(html, match.index + match[0].length),
        ...coordinates,
      });
    }

    return stores;
  },
};
