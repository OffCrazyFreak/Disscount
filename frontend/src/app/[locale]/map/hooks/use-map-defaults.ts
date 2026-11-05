"use client";

import { useUser } from "@/context/user-context";
import { DirectoryStoreDto } from "@/lib/api/schemas";
import { isPinnedChain } from "@/utils/pinned-stores";

/** Starting point for a signed-in user: their pinned chains preselected. */
export function useMapDefaults(stores: DirectoryStoreDto[]) {
  const { accountUser } = useUser();

  const pinnedNames =
    accountUser?.pinnedStores?.map((pinned) => pinned.storeApiId) ?? [];
  const chainCodes = [...new Set(stores.map((store) => store.chain))];
  const pinnedChains = chainCodes.filter((chain) =>
    isPinnedChain(chain, pinnedNames),
  );

  return {
    defaultChains: pinnedChains.length > 0 ? pinnedChains : null,
  };
}
