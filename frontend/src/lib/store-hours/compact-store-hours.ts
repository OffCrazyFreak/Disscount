import type {
  CompactStoreHoursResponse,
  StoreHoursResponse,
} from "@/lib/api/schemas";
import {
  addDays,
  daysBetween,
  zagrebClock,
} from "@/lib/store-hours/zagreb-clock";

/** A growing list that hands back the position of each distinct value. */
function createTable<T>() {
  const positions = new Map<string, number>();
  const items: T[] = [];

  return {
    items,
    indexOf(value: T): number {
      const key = JSON.stringify(value);
      const known = positions.get(key);

      if (known !== undefined) return known;

      positions.set(key, items.length);
      items.push(value);

      return items.length - 1;
    },
  };
}

export function encodeStoreHours(
  response: StoreHoursResponse,
): CompactStoreHoursResponse {
  const baseDate = zagrebClock(new Date(response.generatedAt)).date;
  const weeklyTemplates =
    createTable<CompactStoreHoursResponse["weeklyTemplates"][number]>();
  const datedLists =
    createTable<CompactStoreHoursResponse["datedLists"][number]>();
  const verifiedTimes = createTable<string>();
  const checkUrls = createTable<string>();
  const stores: CompactStoreHoursResponse["stores"] = {};

  for (const [key, store] of Object.entries(response.stores)) {
    stores[key] = [
      weeklyTemplates.indexOf(store.weekly),
      datedLists.indexOf(
        store.dated.map(({ date, ranges, verifiedAt }) => [
          daysBetween(baseDate, date),
          ranges,
          verifiedTimes.indexOf(verifiedAt),
        ]),
      ),
      verifiedTimes.indexOf(store.verifiedAt),
      store.checkUrl === null ? null : checkUrls.indexOf(store.checkUrl),
      store.source,
      store.sundays,
    ];
  }

  return {
    weeklyTemplates: weeklyTemplates.items,
    baseDate,
    datedLists: datedLists.items,
    verifiedTimes: verifiedTimes.items,
    checkUrls: checkUrls.items,
    stores,
    holidays: response.holidays,
    generatedAt: response.generatedAt,
  };
}

/** Stores that share a template or dated list share the decoded object too; nothing may mutate them. */
export function decodeStoreHours(
  compact: CompactStoreHoursResponse,
): StoreHoursResponse {
  const datedLists = compact.datedLists.map((list) =>
    list.map(([dayOffset, ranges, verified]) => ({
      date: addDays(compact.baseDate, dayOffset),
      ranges,
      verifiedAt: compact.verifiedTimes[verified],
    })),
  );

  return {
    stores: Object.fromEntries(
      Object.entries(compact.stores).map(
        ([key, [weekly, dated, verified, checkUrl, source, sundays]]) => [
          key,
          {
            weekly: compact.weeklyTemplates[weekly],
            dated: datedLists[dated],
            sundays,
            source,
            verifiedAt: compact.verifiedTimes[verified],
            checkUrl: checkUrl === null ? null : compact.checkUrls[checkUrl],
          },
        ],
      ),
    ),
    holidays: compact.holidays,
    generatedAt: compact.generatedAt,
  };
}
