import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { WatchlistItemRequest, WatchlistItemDto } from "@/lib/api/types";
import { WATCHLIST_QUERY_KEYS } from "@/lib/api/watchlist/keys";
import {
  addToWatchlist,
  getCurrentUserWatchlist,
  getWatchlistItemsByProductApiId,
  removeFromWatchlist,
} from "@/lib/api/watchlist/queries";

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<WatchlistItemDto, Error, WatchlistItemRequest>({
    mutationKey: OFFLINE_MUTATION_KEYS.watchlistAdd,
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEYS.all });
    },
  });
}

export const watchlistQueries = {
  me: () =>
    queryOptions({
      queryKey: WATCHLIST_QUERY_KEYS.me,
      queryFn: getCurrentUserWatchlist,
    }),

  byProduct: (productApiId: string) =>
    queryOptions({
      queryKey: WATCHLIST_QUERY_KEYS.byProduct(productApiId),
      queryFn: () => getWatchlistItemsByProductApiId(productApiId),
      enabled: !!productApiId,
    }),
};

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.watchlistRemove,
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEYS.all });
    },
  });
}
