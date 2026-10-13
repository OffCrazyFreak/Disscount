import { DirectoryStoreDto } from "@/lib/api/schemas";

// Upstream lists a few chain-wide placeholders (dm's "all") with neither
// address nor town; there is nothing to visit, so the map leaves them out.
export function isVisitableStore(store: DirectoryStoreDto): boolean {
  return Boolean(store.address || store.city);
}
