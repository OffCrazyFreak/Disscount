import "server-only";

import { z } from "zod";

import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { delay, fetchJson, fetchText } from "@/lib/store-locations/http";
import type { ILocatorStore, IStoreLocator } from "@/lib/store-locations/types";

const PAGE_URL = "https://ribola.hr/poslovnice/";
const AJAX_URL = "https://ribola.hr/wp-admin/admin-ajax.php";

const SETTINGS_PATTERN = /ASL_REMOTE = (\{[\s\S]*?\});/;

const settingsSchema = z.object({ nonce: z.string().min(1) });

const storeSchema = z.object({
  title: z.string(),
  street: z.string(),
  city: z.string().nullish(),
  postal_code: z.string().nullish(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

// The Agile Store Locator nonce is minted per page render, so it is read
// from the page every run rather than stored.
async function fetchNonce(signal: AbortSignal): Promise<string> {
  const html = await fetchText(PAGE_URL, signal);
  const literal = SETTINGS_PATTERN.exec(html)?.[1];

  if (!literal) throw new Error("Ribola page has no ASL_REMOTE settings");

  return settingsSchema.parse(JSON.parse(literal)).nonce;
}

// Titles read "Ribola 002 MARKET"; the three digits are cijene-api's store code.
function codeFromTitle(title: string): string | undefined {
  return /\b(\d{3})\b/.exec(title)?.[1];
}

export const ribolaLocator: IStoreLocator = {
  chain: "ribola",

  async fetchStores(signal) {
    const nonce = await fetchNonce(signal);

    await delay(1000, signal);

    const query = new URLSearchParams({
      action: "asl_load_stores",
      nonce,
      load_all: "1",
      layout: "1",
    });
    const payload = await fetchJson(`${AJAX_URL}?${query}`, signal);

    if (!Array.isArray(payload))
      throw new Error("Ribola store list is not an array");

    const stores: ILocatorStore[] = [];

    for (const raw of payload) {
      const parsed = storeSchema.safeParse(raw);

      if (!parsed.success) continue;

      const { title, street, city, postal_code, lat, lng } = parsed.data;
      const coordinates = sanitizeCoordinates(lat, lng);

      if (!coordinates) continue;

      stores.push({
        code: codeFromTitle(title),
        address: street,
        city: city || undefined,
        zipcode: postal_code || undefined,
        ...coordinates,
      });
    }

    return stores;
  },
};
