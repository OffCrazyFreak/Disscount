import "server-only";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import {
  parsePlodineHours,
  plodinePageUrl,
} from "@/lib/store-hours/sources/plodine-hours";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { fetchText } from "@/lib/store-locations/http";
import type {
  ILocatorStore,
  IStoreLocator,
} from "@/lib/store-locations/store-location-types";

const URL = "https://www.plodine.hr/supermarketi";

const ID_PATTERN = /supermarketi\/(\d+)\//;

function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

// The page lists every store twice, card and map marker; both link to /supermarketi/<id>/, which joins them.
function readCoordinates(html: string) {
  const byId = new Map<string, { lat: number; lng: number }>();

  for (const block of html.split('<div class="marker"').slice(1)) {
    const id = ID_PATTERN.exec(block)?.[1];
    const lat = /data-lat="([^"]+)"/.exec(block)?.[1];
    const lng = /data-lng="([^"]+)"/.exec(block)?.[1];

    if (id && lat && lng) byId.set(id, { lat: Number(lat), lng: Number(lng) });
  }

  return byId;
}

export const plodineLocator: IStoreLocator = {
  chain: "plodine",

  async fetchStores(signal) {
    const html = await fetchText(URL, signal);
    const coordinates = readCoordinates(html);
    const stores: ILocatorStore[] = [];
    const { date: today } = zagrebClock(new Date());

    for (const card of html.split('<li class="market ').slice(1)) {
      const id = ID_PATTERN.exec(card)?.[1];
      const location = /class="market__location">([\s\S]*?)<\/div>/.exec(
        card,
      )?.[1];
      const lines = [...(location ?? "").matchAll(/<p>([\s\S]*?)<\/p>/g)].map(
        (match) => clean(match[1]),
      );
      const raw = id ? coordinates.get(id) : undefined;
      const point = raw && sanitizeCoordinates(raw.lat, raw.lng);

      if (!point || !lines[0]) continue;

      const place = /^(\d{5})\s+(.+)$/.exec(lines[1] ?? "");

      stores.push({
        address: lines[0],
        city: place?.[2],
        zipcode: place?.[1],
        hours: parsePlodineHours(card, today),
        pageUrl: plodinePageUrl(card),
        ...point,
      });
    }

    return stores;
  },
};
