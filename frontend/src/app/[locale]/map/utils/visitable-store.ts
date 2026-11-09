import { DirectoryStoreDto } from "@/lib/api/schemas";

// Upstream lists a few chain-wide placeholders (dm's "all") with no address or town, and there is nothing to visit.
export function isVisitableStore(store: DirectoryStoreDto): boolean {
  return Boolean(store.address || store.city);
}
