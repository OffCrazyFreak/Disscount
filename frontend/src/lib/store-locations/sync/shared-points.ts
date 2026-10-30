import {
  placesAgree,
  readPlacedAddress,
} from "@/lib/store-locations/sync/address-place";
import { streetsMatch } from "@/lib/store-locations/address-key";

interface IPointRecord {
  address: string;
  city?: string;
  lat: number;
  lon: number;
}

/**
 * Drops records that share their exact point with a record at another
 * address: the source geocoded at least one of them wrongly, and nothing
 * says which. Two spellings of one address in one place are the same address.
 */
export function withoutSharedPoints<T extends IPointRecord>(records: T[]): T[] {
  const groups = new Map<string, T[]>();

  for (const record of records) {
    const point = `${record.lat},${record.lon}`;

    groups.set(point, [...(groups.get(point) ?? []), record]);
  }

  return records.filter((record) =>
    sameAddress(groups.get(`${record.lat},${record.lon}`) ?? []),
  );
}

function sameAddress(group: IPointRecord[]): boolean {
  if (group.length === 1) return true;

  const [first, ...rest] = group.map((record) => ({
    city: record.city,
    address: readPlacedAddress(record.address),
  }));

  return rest.every(
    ({ city, address }) =>
      address.number === first.address.number &&
      streetsMatch(address.tokens, first.address.tokens, true) &&
      ((placeless(city, address) && placeless(first.city, first.address)) ||
        placesAgree(city, address, first.city, first.address)),
  );
}

function placeless(city: string | undefined, address: { places: string[] }) {
  return !city && address.places.length === 0;
}
