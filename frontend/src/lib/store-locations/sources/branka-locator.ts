import "server-only";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { weekFromLabelled } from "@/lib/store-hours/sources/hours-text";
import { labelledLines } from "@/lib/store-hours/sources/labelled-lines";
import { fetchText } from "@/lib/store-locations/http";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

const URL = "https://www.branka.hr/prodajna-mjesta";

// Each shop block's Google Maps embed holds the pin in its "!2d<lon>!3d<lat>" segment.
const ADDRESS = />\s*([^<>,]+?)\s*,\s*(\d{5})\s+([^<>\s]+)\s*</g;
const EMBED = /google\.com\/maps\/embed\?pb=[^"']*?!2d(-?[\d.]+)!3d(-?[\d.]+)/g;

// "RADNO VRIJEME: PON-SUB: 07:00 - 20:00 sati", inside the shop's own block.
function hoursIn(block: string) {
  const lines = labelledLines(block.split(/RADNO VRIJEME/i)[1] ?? "");

  return lines.length
    ? { weekly: weekFromLabelled(lines), dated: [] }
    : undefined;
}

export const brankaLocator: IStoreLocator = {
  chain: "branka",

  async fetchStores(signal) {
    const html = await fetchText(URL, signal);
    const seen = new Set<string>();
    const shops = [...html.matchAll(ADDRESS)].filter((match) => {
      if (seen.has(match[1])) return false;
      seen.add(match[1]);

      return true;
    });
    const embeds = [...html.matchAll(EMBED)];

    // Without a one-to-one pairing the order cannot be trusted.
    if (shops.length === 0 || shops.length !== embeds.length) return [];

    const stores: ILocatorStore[] = [];

    shops.forEach((shop, index) => {
      const block = html.slice(shop.index, shops[index + 1]?.index);
      const coordinates = sanitizeCoordinates(
        Number(embeds[index][2]),
        Number(embeds[index][1]),
      );
      if (!coordinates) return;

      stores.push({
        address: shop[1],
        city: shop[3],
        zipcode: shop[2],
        hours: hoursIn(block),
        ...coordinates,
      });
    });

    return stores;
  },
};
