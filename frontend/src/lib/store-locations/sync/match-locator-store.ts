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
  const sameAddress = records.filter((record) =>
    addressesMatch(address, parseAddress(record.address)),
  );

  const exact = sameAddress.find((record) => {
    const recordCity = normalizeCity(record.city);

    return city && recordCity
      ? recordCity === city
      : sameZipcode(target, record);
  });
  if (exact) return exact;

  // "Zagreb" against "Zagreb - Dubrava" is the same town written two ways,
  // but only one such candidate is safe: two would be a guess.
  const partial = sameAddress.filter((record) =>
    townContains(city, normalizeCity(record.city)),
  );

  return partial.length === 1 ? partial[0] : null;
}

function sameZipcode(target: ISyncTarget, record: ILocatorStore): boolean {
  return Boolean(
    target.zipcode && record.zipcode && target.zipcode === record.zipcode,
  );
}

/** Whether one town's words all appear in the other's, never a substring. */
function townContains(a: string, b: string): boolean {
  if (!a || !b) return false;

  const [shorter, longer] =
    a.length <= b.length
      ? [a.split(" "), b.split(" ")]
      : [b.split(" "), a.split(" ")];

  return shorter.every((word) => longer.includes(word));
}
