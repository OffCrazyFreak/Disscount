import {
  normalizeCity,
  parseAddress,
  streetsMatch,
  type IParsedAddress,
} from "@/lib/store-locations/address-key";
import { normalizeForSearch } from "@/utils/strings";

/** An address with the village some sources append taken out. */
export interface IPlacedAddress extends IParsedAddress {
  /** The other end of a range like "75-77", which may be the one listed. */
  rangeEnd: string | null;
  /** Villages named in the address, e.g. "Ladimirevci" in "B. Radića 9, Ladimirevci". */
  places: string[];
}

// "B. RADICA 9, Ladimirevci": a comma, then a name with no digits.
const COMMA_PLACE = /^(.*\p{L}.*?)\s*,\s*([^,\d]+)$/u;

// "Ul. Matije Gupca 6 Sladojevci": words of three letters or more after the
// number, so a house letter ("25 B") is not read as a village.
const TRAILING_PLACE = /^(.*\p{L}.*?\d+)\s+(\p{L}{3,}(?:\s+\p{L}+)*)$/u;

const RANGE = /(\d+)\s*[-_]\s*(\d+)(?!\d|\p{L})/u;

export function readPlacedAddress(
  address: string | null | undefined,
): IPlacedAddress {
  let street = (address ?? "").replace(/\([^)]*\)/g, " ").trim();
  const places: string[] = [];

  for (const pattern of [COMMA_PLACE, TRAILING_PLACE]) {
    const match = pattern.exec(street);

    if (match) {
      street = match[1];
      places.push(normalizeCity(match[2]));
    }
  }

  const range = RANGE.exec(street);
  const parsed = parseAddress(range ? street.replace(RANGE, "$1") : street);

  return { ...parsed, rangeEnd: range?.[2] ?? null, places };
}

/** Same street and house number, "0" and "bb" on both sides counting as one. */
export function placedAddressesAgree(
  a: IPlacedAddress,
  b: IPlacedAddress,
): boolean {
  const sameNumber =
    a.number === b.number ||
    (b.number !== null && a.rangeEnd === b.number) ||
    (a.number !== null && b.rangeEnd === a.number);

  return sameNumber && streetsMatch(a.tokens, b.tokens, true);
}

/** Whether any town or village of one side is a town or village of the other. */
export function townsAgree(a: string[], b: string[]): boolean {
  return a.some((one) => b.some((other) => townContains(one, other)));
}

/** Whether one town's words all appear in the other's, never a substring. */
export function townContains(a: string, b: string): boolean {
  if (!a || !b) return false;

  const [shorter, longer] =
    a.length <= b.length
      ? [a.split(" "), b.split(" ")]
      : [b.split(" "), a.split(" ")];

  return shorter.every((word) => longer.includes(word));
}

/**
 * Drops records that share their exact point with a record at another
 * address: the source geocoded at least one of them wrongly, and nothing
 * says which.
 */
export function withoutSharedPoints<
  T extends { address: string; lat: number; lon: number },
>(records: T[]): T[] {
  const addresses = new Map<string, Set<string>>();

  for (const record of records) {
    const point = `${record.lat},${record.lon}`;
    const set = addresses.get(point) ?? new Set<string>();

    set.add(normalizeForSearch(record.address).replace(/[^a-z0-9]/g, ""));
    addresses.set(point, set);
  }

  return records.filter(
    (record) => addresses.get(`${record.lat},${record.lon}`)?.size === 1,
  );
}
