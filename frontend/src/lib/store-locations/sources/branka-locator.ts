import "server-only";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const URL = "https://www.branka.hr/prodajna-mjesta";

// Each shop block holds a "street, ZIP city" text node followed by a Google
// Maps embed, whose "!2d<lon>!3d<lat>" segment is the pin.
const ADDRESS = />\s*([^<>,]+?)\s*,\s*(\d{5})\s+([^<>\s]+)\s*</g;
const EMBED = /google\.com\/maps\/embed\?pb=[^"']*?!2d(-?[\d.]+)!3d(-?[\d.]+)/g;

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
      const coordinates = sanitizeCoordinates(
        Number(embeds[index][2]),
        Number(embeds[index][1]),
      );
      if (!coordinates) return;

      stores.push({
        address: shop[1],
        city: shop[3],
        zipcode: shop[2],
        ...coordinates,
      });
    });

    return stores;
  },
};
