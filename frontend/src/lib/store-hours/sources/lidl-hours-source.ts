import "server-only";

import { z } from "zod";

import type {
  IHoursSource,
  IHoursRecord,
} from "@/lib/store-hours/sync/hours-source-types";
import {
  dayIndex,
  parseClockRange,
  settleSundays,
} from "@/lib/store-hours/sources/hours-text";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import { sanitizeCoordinates } from "@/lib/store-locations/croatia-bounds";
import { delay, fetchText } from "@/lib/store-locations/http";

const SITEMAP_URL =
  "https://www.lidl.hr/s/hr-HR/trazilica-trgovina/sitemap.xml";

// ".../trazilica-trgovina/<town>/<street>/": county and town pages have one segment.
const STORE_PAGE =
  /^https:\/\/www\.lidl\.hr\/s\/hr-HR\/trazilica-trgovina\/[\w-]+\/[\w-]+\/$/;

// One page a second: 116 pages take two minutes, gentle on a site with bot detection.
const PAGE_INTERVAL_MS = 1_000;

const specification = z.object({
  dayOfWeek: z.union([z.array(z.string()), z.string()]).optional(),
  validFrom: z.string().optional(),
  validThrough: z.string().optional(),
  opens: z.string(),
  closes: z.string(),
});

const storeSchema = z.object({
  "@type": z.literal("GroceryStore"),
  address: z.object({
    streetAddress: z.string(),
    addressLocality: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  geo: z.object({ latitude: z.number(), longitude: z.number() }),
  openingHoursSpecification: z.array(specification).catch([]),
  specialOpeningHoursSpecification: z
    .array(specification)
    .nullish()
    .catch(null),
});

function rangesOf(spec: z.infer<typeof specification>) {
  const range = parseClockRange(
    `${spec.opens.slice(0, 5)}-${spec.closes.slice(0, 5)}`,
  );

  return range ? [range] : [];
}

type Specification = z.infer<typeof specification>;

// A day no specification names is closed, as schema.org reads it.
function weeklyOf(specs: Specification[]) {
  const weekly = Array.from(
    { length: 7 },
    () => [] as ReturnType<typeof rangesOf>,
  );

  for (const spec of specs) {
    for (const day of [spec.dayOfWeek ?? []].flat()) {
      const index = dayIndex(day.replace(/^https?:\/\/schema\.org\//, ""));

      if (index !== -1) weekly[index] = rangesOf(spec);
    }
  }

  return weekly;
}

function singleDays(specs: Specification[], today: string) {
  return specs.flatMap((spec) =>
    spec.validFrom &&
    spec.validFrom === spec.validThrough &&
    spec.validFrom >= today
      ? [{ date: spec.validFrom, ranges: rangesOf(spec) }]
      : [],
  );
}

function groceryStoreIn(html: string) {
  for (const match of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      const store = storeSchema.safeParse(JSON.parse(match[1]));

      if (store.success) return store.data;
    } catch {
      // Another script block; the store's is further on.
    }
  }

  return null;
}

/** The page's schema.org GroceryStore, which carries the weekly and special hours. */
export function parseLidlStore(
  html: string,
  pageUrl: string,
  today: string,
): IHoursRecord | null {
  const store = groceryStoreIn(html);
  const point =
    store && sanitizeCoordinates(store.geo.latitude, store.geo.longitude);

  if (!store || !point) return null;

  const special = singleDays(
    store.specialOpeningHoursSpecification ?? [],
    today,
  );

  return {
    address: store.address.streetAddress,
    city: store.address.addressLocality,
    zipcode: store.address.postalCode,
    ...point,
    // Lidl lists a store's trading Sundays about two weeks ahead.
    hours: {
      weekly: weeklyOf(store.openingHoursSpecification),
      dated: settleSundays(special, today),
    },
    pageUrl,
  };
}

export const lidlHoursSource: IHoursSource = {
  chain: "lidl",

  async fetchHours(signal) {
    const sitemap = await fetchText(SITEMAP_URL, signal);
    const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1].trim())
      .filter((url) => STORE_PAGE.test(url));
    const today = zagrebClock(new Date()).date;
    const records: IHoursRecord[] = [];

    for (const pageUrl of pages) {
      await delay(PAGE_INTERVAL_MS, signal);

      try {
        const record = parseLidlStore(
          await fetchText(pageUrl, signal),
          pageUrl,
          today,
        );

        if (record) records.push(record);
      } catch (error) {
        // One page failing costs that store, not the chain.
        console.warn(`[store-hours] lidl page failed ${pageUrl}`, error);
      }
    }

    return records;
  },
};
