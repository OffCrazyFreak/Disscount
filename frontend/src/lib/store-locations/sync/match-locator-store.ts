import {
  addressesMatch,
  normalizeCity,
  parseAddress,
} from "@/lib/store-locations/address-key";
import { ILocatorStore } from "@/lib/store-locations/types";
import {
  placedAddressesAgree,
  placesAgree,
  readPlacedAddress,
  townContains,
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
  chainCodes: string[] = [target.code],
): ILocatorStore | null {
  const byCode = records.find((record) => record.code === target.code);
  if (byCode) return byCode;

  const byAddress = matchByAddress(target, records);
  if (byAddress) return byAddress;

  // The looser rules below trust the record's point more, so a point the
  // source gave two different addresses, or only a street, is not used by
  // them. An approximate record still counts as a rival, so it can only make
  // a match ambiguous, never decide one.
  const usable = withoutSharedPoints(records);
  const match =
    matchByCodeSuffix(target, usable, chainCodes) ??
    matchByPlace(target, usable);

  return match?.approximate ? null : match;
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
 * also needs the address or the town to agree, and no other upstream code of
 * the chain may end in the same number.
 */
function matchByCodeSuffix(
  target: ISyncTarget,
  records: ILocatorStore[],
  chainCodes: string[],
): ILocatorStore | null {
  const numbered = records.filter(
    ({ codeSuffix }) => codeSuffix && carriesSuffix(target.code, codeSuffix),
  );
  if (numbered.length !== 1) return null;

  const suffix = numbered[0].codeSuffix ?? "";
  const claimants = chainCodes.filter((code) => carriesSuffix(code, suffix));

  if (claimants.some((code) => code !== target.code)) return null;

  const [record] = numbered;
  const address = readPlacedAddress(target.address);
  const other = readPlacedAddress(record.address);

  return placedAddressesAgree(address, other) ||
    placesAgree(target.city, address, record.city, other)
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

  const candidates = records.filter((record) => {
    const other = readPlacedAddress(record.address);

    return (
      placedAddressesAgree(address, other) &&
      placesAgree(target.city, address, record.city, other)
    );
  });

  return candidates.length === 1 ? candidates[0] : null;
}

// NTL's "BR. 350" is code 20350: the number after one leading digit.
export function carriesSuffix(code: string, suffix: string): boolean {
  return code.length === suffix.length + 1 && code.endsWith(suffix);
}

function sameZipcode(target: ISyncTarget, record: ILocatorStore): boolean {
  return Boolean(
    target.zipcode && record.zipcode && target.zipcode === record.zipcode,
  );
}
