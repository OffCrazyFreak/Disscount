import "server-only";

import { lidlHoursSource } from "@/lib/store-hours/sources/lidl-hours-source";
import { studenacHoursSource } from "@/lib/store-hours/sources/studenac-hours-source";
import { trgocentarHoursSource } from "@/lib/store-hours/sources/trgocentar-hours-source";
import { trgovinaKrkHoursSource } from "@/lib/store-hours/sources/trgovina-krk-hours-source";
import type {
  IHoursRecord,
  IHoursSource,
} from "@/lib/store-hours/sync/hours-source-types";
import { storeLocators } from "@/lib/store-locations/sources";
import type { IStoreLocator } from "@/lib/store-locations/store-location-types";

// These chains publish better hours elsewhere than in their locator feed.
const OWN_SOURCES = [
  lidlHoursSource,
  studenacHoursSource,
  trgocentarHoursSource,
  trgovinaKrkHoursSource,
];

function fromLocator(locator: IStoreLocator): IHoursSource {
  return {
    chain: locator.chain,
    async fetchHours(signal) {
      const stores = await locator.fetchStores(signal);

      return stores.flatMap((store): IHoursRecord[] =>
        store.hours ? [{ ...store, hours: store.hours }] : [],
      );
    },
  };
}

/** One hours source per chain: its own where it has one, else its locator. */
export const hoursSources: IHoursSource[] = [
  ...OWN_SOURCES,
  ...storeLocators
    .filter(
      (locator) => !OWN_SOURCES.some((own) => own.chain === locator.chain),
    )
    .map(fromLocator),
];
