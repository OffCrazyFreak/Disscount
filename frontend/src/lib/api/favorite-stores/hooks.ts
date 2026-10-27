import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FAVORITE_STORE_QUERY_KEYS } from "@/lib/api/favorite-stores/keys";
import {
  getFavoriteStores,
  updateFavoriteStores,
} from "@/lib/api/favorite-stores/queries";
import type { FavoriteStoreDto } from "@/lib/api/types";

/** The backend caps the list here too; a longer request is rejected. */
export const MAX_FAVORITE_STORES = 10;

export function useFavoriteStoresQuery({ enabled = true } = {}) {
  return useQuery<FavoriteStoreDto[], Error>({
    queryKey: FAVORITE_STORE_QUERY_KEYS.all,
    queryFn: getFavoriteStores,
    enabled,
  });
}

const SAVE_MUTATION_KEY = [...FAVORITE_STORE_QUERY_KEYS.all, "save"];

/** Saves the full list of keys, showing it at once and rolling back on failure. */
export function useSaveFavoriteStores() {
  const queryClient = useQueryClient();

  return useMutation<
    FavoriteStoreDto[],
    Error,
    string[],
    { previous: FavoriteStoreDto[] | undefined }
  >({
    mutationKey: SAVE_MUTATION_KEY,
    // Each save replaces the whole list, so they must reach the server in click order.
    scope: { id: "favoriteStores" },
    // Not on the offline allowlist: fail and roll back instead of pausing.
    networkMode: "always",
    mutationFn: (keys) =>
      updateFavoriteStores({
        stores: keys.map((storeKey) => ({ storeKey })),
      }),
    onMutate: async (keys) => {
      await queryClient.cancelQueries({
        queryKey: FAVORITE_STORE_QUERY_KEYS.all,
      });
      const previous = queryClient.getQueryData<FavoriteStoreDto[]>(
        FAVORITE_STORE_QUERY_KEYS.all,
      );
      queryClient.setQueryData<FavoriteStoreDto[]>(
        FAVORITE_STORE_QUERY_KEYS.all,
        keys.map((storeKey) => ({ id: storeKey, storeKey })),
      );
      return { previous };
    },
    onError: (_error, _keys, context) => {
      queryClient.setQueryData(
        FAVORITE_STORE_QUERY_KEYS.all,
        context?.previous,
      );
    },
    // A refetch between queued saves would show an older list for a moment.
    onSettled: () =>
      queryClient.isMutating({ mutationKey: SAVE_MUTATION_KEY }) === 1
        ? queryClient.invalidateQueries({
            queryKey: FAVORITE_STORE_QUERY_KEYS.all,
          })
        : undefined,
  });
}
