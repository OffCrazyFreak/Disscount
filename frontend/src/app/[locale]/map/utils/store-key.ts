/** URL-safe identity of a store, shared by the list, the map and `?store=`. */
export function toStoreKey(chain: string, code: string): string {
  return `${chain}:${code}`;
}
