/** URL-safe identity of a store, shared by the list, the map and `?store=`. */
export function toStoreKey(chain: string, code: string): string {
  return `${chain}:${code}`;
}

export function parseStoreKey(
  key: string | null,
): { chain: string; code: string } | null {
  if (!key) return null;

  const separator = key.indexOf(":");
  if (separator <= 0 || separator === key.length - 1) return null;

  return { chain: key.slice(0, separator), code: key.slice(separator + 1) };
}
