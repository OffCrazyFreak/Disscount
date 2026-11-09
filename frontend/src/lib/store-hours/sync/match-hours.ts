import type { StoreResponse } from "@/lib/cijene-api/schemas";
import { cleanUpstreamAddress } from "@/lib/store-locations/address-key";
import { matchLocatorStore } from "@/lib/store-locations/sync/match-locator-store";
import type { IHoursRecord } from "@/lib/store-hours/sync/hours-source-types";

type PlacedRecord = IHoursRecord & { lat: number; lon: number };

function hasPoint(record: IHoursRecord): record is PlacedRecord {
  return record.lat !== undefined && record.lon !== undefined;
}

export interface IMatchedHours {
  chain: string;
  code: string;
  record: IHoursRecord;
}

/** By the location sync's rules, so hours land on the same store a locator pin would. */
export function matchHours(
  chain: string,
  records: IHoursRecord[],
  upstream: StoreResponse[],
): IMatchedHours[] {
  const stores = upstream.filter((store) => store.chain_code === chain);
  const codes = stores.map((store) => store.code);
  const placed = records.filter(hasPoint);
  const matched: IMatchedHours[] = [];

  for (const store of stores) {
    const record =
      records.find((candidate) => candidate.code === store.code) ??
      matchLocatorStore(
        {
          chain,
          code: store.code,
          address: cleanUpstreamAddress(store.address),
          city: store.city,
          zipcode: store.zipcode,
          skipGeoapify: false,
        },
        placed,
        codes,
      );

    if (record) matched.push({ chain, code: store.code, record });
  }

  return matched;
}
