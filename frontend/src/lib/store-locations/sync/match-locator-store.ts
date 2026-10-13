import {
  addressesMatch,
  normalizeCity,
  parseAddress,
} from "@/lib/store-locations/address-key";
import { ILocatorStore } from "@/lib/store-locations/types";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

/**
 * Finds the locator record for an upstream store: by store code when the chain
 * shares it, otherwise by address. The town has to agree too, because the same
 * street and number exist in many towns ("Zagrebačka 10").
 */
export function matchLocatorStore(
  target: ISyncTarget,
  records: ILocatorStore[],
): ILocatorStore | null {
  const byCode = records.find((record) => record.code === target.code);
  if (byCode) return byCode;

  const address = parseAddress(target.address);
  const city = normalizeCity(target.city);

  return (
    records.find(
      (record) =>
        sameTown(target, city, record) &&
        addressesMatch(address, parseAddress(record.address)),
    ) ?? null
  );
}

function sameTown(
  target: ISyncTarget,
  city: string,
  record: ILocatorStore,
): boolean {
  const recordCity = normalizeCity(record.city);

  if (city && recordCity) {
    return (
      city === recordCity ||
      city.includes(recordCity) ||
      recordCity.includes(city)
    );
  }

  return Boolean(
    target.zipcode && record.zipcode && target.zipcode === record.zipcode,
  );
}
