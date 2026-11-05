import {
  addressesMatch,
  normalizeCity,
  parseAddress,
} from "@/lib/store-locations/address-key";
import { ILocatorStore } from "@/lib/store-locations/store-location-types";
import {
  placedAddressesAgree,
  placesAgree,
  readPlacedAddress,
  townContains,
} from "@/lib/store-locations/sync/address-place";
import { withoutSharedPoints } from "@/lib/store-locations/sync/shared-points";
import { ISyncTarget } from "@/lib/store-locations/sync/sync-target";

/** The town has to agree too, because the same street and number exist in many towns ("Zagrebačka 10"). */
export function matchLocatorStore<T extends ILocatorStore>(
  target: ISyncTarget,
  records: T[],
  chainCodes: string[] = [target.code],
): T | null {
  const byCode = records.find((record) => record.code === target.code);
  if (byCode) return byCode;

  const byAddress = matchByAddress(target, records);
  if (byAddress) return byAddress;

  // The looser rules trust the point more, so shared or street-level points are out; approximate only adds ambiguity.
  const usable = withoutSharedPoints(records);
  const match =
    matchByCodeSuffix(target, usable, chainCodes) ??
    matchByPlace(target, usable);

  return match?.approximate ? null : match;
}

function matchByAddress<T extends ILocatorStore>(
  target: ISyncTarget,
  records: T[],
): T | null {
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

  // "Zagreb" and "Zagreb - Dubrava" are one town written two ways, but only a single candidate is safe.
  const partial = sameAddress.filter((record) =>
    townContains(city, normalizeCity(record.city)),
  );

  return partial.length === 1 ? partial[0] : null;
}

/** A store number is weaker than a code: address or town must agree, and no other code may end the same. */
function matchByCodeSuffix<T extends ILocatorStore>(
  target: ISyncTarget,
  records: T[],
  chainCodes: string[],
): T | null {
  const record = numberedRecord(target, records, chainCodes);
  if (!record) return null;

  const address = readPlacedAddress(target.address);
  const other = readPlacedAddress(record.address);

  return placedAddressesAgree(address, other) ||
    placesAgree(target.city, address, record.city, other)
    ? record
    : null;
}

/** Sources write the village where upstream has the municipality, so only a single candidate is trusted. */
function matchByPlace<T extends ILocatorStore>(
  target: ISyncTarget,
  records: T[],
): T | null {
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

/** The one record carrying the store's number, when no other code claims it. */
export function numberedRecord<T extends ILocatorStore>(
  target: ISyncTarget,
  records: T[],
  chainCodes: string[],
): T | null {
  const numbered = records.filter(
    ({ codeSuffix }) => codeSuffix && carriesSuffix(target.code, codeSuffix),
  );
  if (numbered.length !== 1) return null;

  const suffix = numbered[0].codeSuffix ?? "";
  const claimants = chainCodes.filter((code) => carriesSuffix(code, suffix));

  return claimants.some((code) => code !== target.code) ? null : numbered[0];
}

// NTL's "BR. 350" is code 20350: the number after one leading digit.
function carriesSuffix(code: string, suffix: string): boolean {
  return code.length === suffix.length + 1 && code.endsWith(suffix);
}

function sameZipcode(target: ISyncTarget, record: ILocatorStore): boolean {
  return Boolean(
    target.zipcode && record.zipcode && target.zipcode === record.zipcode,
  );
}
