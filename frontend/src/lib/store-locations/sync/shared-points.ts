import { readPlacedAddress } from "@/lib/store-locations/sync/address-place";
import { streetsMatch } from "@/lib/store-locations/address-key";

interface IPointRecord {
  address: string;
  lat: number;
  lon: number;
}

/**
 * Drops records that share their exact point with a record at another
 * address: the source geocoded at least one of them wrongly, and nothing
 * says which. Two spellings of one address are the same address.
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

  const [first, ...rest] = group.map((record) =>
    readPlacedAddress(record.address),
  );

  return rest.every(
    (other) =>
      other.number === first.number &&
      streetsMatch(other.tokens, first.tokens, true),
  );
}
