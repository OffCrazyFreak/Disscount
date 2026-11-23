import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { WATCHLIST_QUERY_KEYS } from "@/lib/api/watchlist/keys";
import {
  addToWatchlist,
  getCurrentUserWatchlist,
  getWatchlistItemsByProductApiId,
  removeFromWatchlist,
} from "@/lib/api/watchlist/queries";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import type { WatchlistItemRequest, WatchlistItemDto } from "@/lib/api/types";

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

function currentUserWatchlistQueryOptions() {
  return queryOptions({
    queryKey: WATCHLIST_QUERY_KEYS.me,
    queryFn: getCurrentUserWatchlist,
  });
}

function watchlistItemsByProductQueryOptions(productApiId: string) {
  return queryOptions({
    queryKey: WATCHLIST_QUERY_KEYS.byProduct(productApiId),
    queryFn: () => getWatchlistItemsByProductApiId(productApiId),
    enabled: !!productApiId,
  });
}

export function useGetCurrentUserWatchlist({ enabled = true } = {}) {
  return useQuery({ ...currentUserWatchlistQueryOptions(), enabled });
}

export function useGetWatchlistItemsByProductApiId(productApiId: string) {
  return useQuery(watchlistItemsByProductQueryOptions(productApiId));
}

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
