import "server-only";

import { cijeneApiV1Client } from "@/lib/cijene-api/client";
import {
  listStoresResponseSchema,
  StoreResponse,
} from "@/lib/cijene-api/schemas";

/** Every store cijene-api knows, unfiltered, so null-coordinate ones are kept. */
export async function fetchUpstreamStores(): Promise<StoreResponse[]> {
  const response = await cijeneApiV1Client.get("/stores/");

  return listStoresResponseSchema.parse(response.data).stores;
}

/** Stable key for a store across upstream, our table and the URL. */
export function storeKey(chain: string, code: string): string {
  return `${chain}:${code}`;
}
