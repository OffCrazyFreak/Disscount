import "server-only";

import { parseTrgocentarSundays } from "@/lib/store-hours/sources/trgocentar-hours";
import type { IHoursSource } from "@/lib/store-hours/sync/hours-source-types";
import { zagrebClock } from "@/lib/store-hours/zagreb-clock";
import {
  addressesMatch,
  parseAddress,
} from "@/lib/store-locations/address-key";
import { delay, fetchText } from "@/lib/store-locations/http";
import { trgocentarLocator } from "@/lib/store-locations/sources/trgocentar-locator";

const SUNDAYS_URL = "https://trgocentar.com/radne-nedjelje/";

/**
 * The locator's weekly hours plus the "Radne nedjelje" sheet, which names
 * each shop by cijene-api's code and settles every Sunday of its month.
 */
export const trgocentarHoursSource: IHoursSource = {
  chain: "trgocentar",

  async fetchHours(signal) {
    const stores = await trgocentarLocator.fetchStores(signal);

    await delay(1_000, signal);

    const today = zagrebClock(new Date()).date;
    const sundays = parseTrgocentarSundays(
      await fetchText(SUNDAYS_URL, signal),
      today,
    );

    return stores.flatMap((store) => {
      if (!store.hours) return [];

      const address = parseAddress(store.address);
      const sheet = sundays.find((row) =>
        addressesMatch(address, parseAddress(row.address.split(",")[0])),
      );

      return [
        {
          ...store,
          code: sheet?.code,
          hours: { ...store.hours, dated: sheet?.dated ?? [] },
        },
      ];
    });
  },
};
