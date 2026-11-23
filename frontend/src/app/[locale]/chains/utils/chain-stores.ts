import { isVisitableStore } from "@/app/[locale]/map/utils/visitable-store";
import type { DirectoryStoreDto } from "@/lib/api/schemas";
import type { ChainStats } from "@/lib/cijene-api/schemas";
import { getLocationLabel } from "@/utils/labels";
import { compareHr } from "@/utils/strings";

export interface IChainCity {
  city: string;
  storeCount: number;
}

/** The stores the map shows, so a hub never counts a placeholder the map leaves out. */
export function chainStores(
  stores: DirectoryStoreDto[],
  chain: string,
): DirectoryStoreDto[] {
  return stores.filter(
    (store) => store.chain === chain && isVisitableStore(store),
  );
}

export function storeCountsByChain(
  stores: DirectoryStoreDto[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const store of stores) {
    if (!isVisitableStore(store)) continue;

    counts.set(store.chain, (counts.get(store.chain) ?? 0) + 1);
  }

  return counts;
}

/** Most stores first, then by name; a store without a town counts toward the chain but no city. */
export function citiesByStoreCount(stores: DirectoryStoreDto[]): IChainCity[] {
  const counts = new Map<string, number>();

  for (const store of stores) {
    const city = getLocationLabel(store.city);
    if (!city) continue;

    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  return [...counts]
    .map(([city, storeCount]) => ({ city, storeCount }))
    .sort((a, b) => b.storeCount - a.storeCount || compareHr(a.city, b.city));
}

const TOP_CITY_COUNT = 3;

/** "Zagreb (120), Split (40) i Rijeka (30)", or null when one place leaves nothing to rank. */
export function topCitiesPhrase(
  cities: IChainCity[],
  locale: string,
): string | null {
  if (cities.length < 2) return null;

  return new Intl.ListFormat(locale, { type: "conjunction" }).format(
    cities
      .slice(0, TOP_CITY_COUNT)
      .map(({ city, storeCount }) => `${city} (${storeCount})`),
  );
}

/** False only with no store and no upstream prices; unknown stats (an outage) keep the hub indexed. */
export function hasChainContent(
  storeCount: number,
  stats: ChainStats[] | null,
  chain: string,
): boolean {
  if (storeCount > 0 || stats === null) return true;

  return stats.some((stat) => stat.chain_code === chain);
}
