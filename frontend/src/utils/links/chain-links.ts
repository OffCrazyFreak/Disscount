import { storeNamesMap } from "@/constants/name-mappings";

export const CHAINS_PATH = "/chains";

/** Only chains with a name and logo get a hub, so a code upstream adds later 404s until it is mapped. */
export const MAPPED_CHAIN_CODES = Object.keys(storeNamesMap);

export function isMappedChain(code: string): boolean {
  return Object.hasOwn(storeNamesMap, code);
}

export function chainPath(code: string): string {
  return `${CHAINS_PATH}/${encodeURIComponent(code)}`;
}

/** The map reads ?chain= as its chain filter. */
export function chainMapPath(code: string): string {
  return `/map?chain=${encodeURIComponent(code)}`;
}
