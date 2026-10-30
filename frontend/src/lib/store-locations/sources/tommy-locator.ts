import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const PAGE_URL = "https://www.tommy.hr/prodavaonice";

const NEXT_DATA_PATTERN =
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

const channelSchema = z.object({
  "@type": z.literal("Channel"),
  address: z.object({
    street: z.string(),
    city: z.string().nullish(),
    postcode: z.string().nullish(),
  }),
  position: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
});

// The channels sit in React Query's dehydrated cache, whose exact path can
// shift between releases, so walk the tree for Channel collections instead.
function collectChannels(node: unknown, found: unknown[] = []): unknown[] {
  if (Array.isArray(node)) {
    for (const item of node) collectChannels(item, found);
  } else if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;

    if (record["@type"] === "Channel") {
      found.push(record);
    } else {
      for (const value of Object.values(record)) collectChannels(value, found);
    }
  }

  return found;
}

export const tommyLocator: IStoreLocator = {
  chain: "tommy",

  async fetchStores(signal) {
    const html = await fetchText(PAGE_URL, signal);
    const json = NEXT_DATA_PATTERN.exec(html)?.[1];

    if (!json) throw new Error("Tommy page has no __NEXT_DATA__");

    const seen = new Set<string>();
    const stores: ILocatorStore[] = [];

    for (const raw of collectChannels(JSON.parse(json) as unknown)) {
      const parsed = channelSchema.safeParse(raw);

      if (!parsed.success) continue;

      const { address, position } = parsed.data;
      const coordinates = sanitizeCoordinates(
        position.latitude,
        position.longitude,
      );

      if (!coordinates) continue;

      // The same channel is cached under several queries.
      const key = `${address.street}|${address.city}`;

      if (seen.has(key)) continue;

      seen.add(key);

      stores.push({
        address: address.street,
        city: address.city ?? undefined,
        zipcode: address.postcode ?? undefined,
        ...coordinates,
      });
    }

    return stores;
  },
};
