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
  /** The address says outright that the building has no number: "0" or "bb". */
  numberless: boolean;
}

// "B. RADICA 9, Ladimirevci": a comma, then a name with no digits.
const COMMA_PLACE = /^(.*\p{L}.*?)\s*,\s*([^,\d]+)$/u;

// "Ul. Matije Gupca 6 Sladojevci": words after the number. Three letters at
// least, so a house letter ("25 B") is not read as a village.
const TRAILING_PLACE = /^(.*\p{L}.*?\d+)\s+(\p{L}{3,}(?:\s+\p{L}+)*)$/u;

// "bb" after a comma, or the end of "Ulica 1 svibnja bb", is no village.
function isPlaceName(text: string): boolean {
  return !/(^|\s)bb($|\s)/.test(normalizeCity(text));
}

const RANGE = /(\d+)\s*[-_]\s*(\d+)(?!\d|\p{L})/u;

export function readPlacedAddress(
  address: string | null | undefined,
): IPlacedAddress {
  let street = (address ?? "").replace(/\([^)]*\)/g, " ").trim();
  const places: string[] = [];

  for (const pattern of [COMMA_PLACE, TRAILING_PLACE]) {
    const match = pattern.exec(street);

    if (match && isPlaceName(match[2])) {
      street = match[1];
      places.push(normalizeCity(match[2]));
    }
  }

  const range = RANGE.exec(street);
  const parsed = parseAddress(range ? street.replace(RANGE, "$1") : street);

  return {
    ...parsed,
    rangeEnd: range?.[2] ?? null,
    places,
    numberless: /(^| )(0+|bb)( |$)/.test(
      normalizeForSearch(street).replace(/[^a-z0-9]+/g, " "),
    ),
  };
}

/**
 * Whether the target's address and a record's name the same building: same
 * street, and the same number or one end of the target's range. A street
 * without numbers matches only when upstream says so with "0" or "bb", since
 * a number that is merely missing could be any building on the street.
 */
export function placedAddressesAgree(
  target: IPlacedAddress,
  record: IPlacedAddress,
): boolean {
  return (
    numbersAgree(target, record) &&
    streetsMatch(target.tokens, record.tokens, true)
  );
}

function numbersAgree(target: IPlacedAddress, record: IPlacedAddress) {
  if (target.number === null || record.number === null) {
    return target.number === record.number && target.numberless;
  }

  if (target.rangeEnd && record.rangeEnd) {
    return (
      target.number === record.number && target.rangeEnd === record.rangeEnd
    );
  }

  const ends = (address: IPlacedAddress) =>
    [address.number, address.rangeEnd].filter(Boolean);

  return ends(target).some((end) => ends(record).includes(end));
}

/**
 * Whether two addresses lie in the same place. When both name a village, the
 * villages decide: two villages of one municipality are different places.
 */
export function placesAgree(
  cityA: string | null | undefined,
  a: IPlacedAddress,
  cityB: string | null | undefined,
  b: IPlacedAddress,
): boolean {
  if (a.places.length > 0 && b.places.length > 0) {
    return townsAgree(a.places, b.places);
  }

  return townsAgree(townsOf(cityA, a), townsOf(cityB, b));
}

function townsOf(city: string | null | undefined, address: IPlacedAddress) {
  return [normalizeCity(city), ...address.places].filter(Boolean);
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
