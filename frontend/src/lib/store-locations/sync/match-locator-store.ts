import {
  addressesMatch,
  normalizeCity,
  parseAddress,
} from "@/lib/store-locations/address-key";
import { ILocatorStore } from "@/lib/store-locations/types";
import {
  placedAddressesAgree,
  readPlacedAddress,
  townContains,
  townsAgree,
} from "@/lib/store-locations/sync/address-place";
import { withoutSharedPoints } from "@/lib/store-locations/sync/shared-points";
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

  const byAddress = matchByAddress(target, records);
  if (byAddress) return byAddress;

  // The looser rules below trust the record's point more, so a point the
  // source gave two different addresses is not used by them.
  const usable = withoutSharedPoints(records);

  return matchByCodeSuffix(target, usable) ?? matchByPlace(target, usable);
}

function matchByAddress(
  target: ISyncTarget,
  records: ILocatorStore[],
): ILocatorStore | null {
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

/**
 * A store number is a weaker key than a code, so the one record carrying it
 * also needs the address or the town to agree.
 */
function matchByCodeSuffix(
  target: ISyncTarget,
  records: ILocatorStore[],
): ILocatorStore | null {
  const numbered = records.filter(
    ({ codeSuffix }) =>
      codeSuffix &&
      target.code.length === codeSuffix.length + 1 &&
      target.code.endsWith(codeSuffix),
  );
  if (numbered.length !== 1) return null;

  const [record] = numbered;
  const address = readPlacedAddress(target.address);
  const other = readPlacedAddress(record.address);

  return placedAddressesAgree(address, other) ||
    townsAgree(townsOf(target.city, address), townsOf(record.city, other))
    ? record
    : null;
}

/**
 * Sources write the village into the address ("B. Radića 9, Ladimirevci")
 * while upstream's town is the municipality, and both write "0" or "bb" for
 * a street without numbers. Only a single candidate is trusted.
 */
function matchByPlace(
  target: ISyncTarget,
  records: ILocatorStore[],
): ILocatorStore | null {
  const address = readPlacedAddress(target.address);
  const towns = townsOf(target.city, address);

  const candidates = records.filter((record) => {
    const other = readPlacedAddress(record.address);

    return (
      placedAddressesAgree(address, other) &&
      townsAgree(towns, townsOf(record.city, other))
    );
  });

  return candidates.length === 1 ? candidates[0] : null;
}

function townsOf(
  city: string | null | undefined,
  address: { places: string[] },
): string[] {
  return [normalizeCity(city), ...address.places].filter(Boolean);
}

function sameZipcode(target: ISyncTarget, record: ILocatorStore): boolean {
  return Boolean(
    target.zipcode && record.zipcode && target.zipcode === record.zipcode,
  );
}
