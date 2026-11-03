import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import { WATCHLIST_QUERY_KEYS } from "@/lib/api/watchlist/keys";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { WatchlistItemRequest, WatchlistItemDto } from "@/lib/api/types";

/**
 * Add product to watchlist
 */
export async function addToWatchlist(
  data: WatchlistItemRequest,
): Promise<WatchlistItemDto> {
  const response = await apiClient.post<WatchlistItemDto>(
    "/api/watchlist",
    data,
  );
  return response.data;
}

/**
 * Get current user's watchlist
 */
async function getCurrentUserWatchlist(): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<WatchlistItemDto[]>("/api/watchlist/me");
  return response.data;
}

/**
 * Get watchlist items by product API ID (EAN)
 * Returns all watchlist items for this product (can have multiple with different watch types)
 */
async function getWatchlistItemsByProductApiId(
  productApiId: string,
): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<WatchlistItemDto[]>(
    `/api/watchlist/product/${productApiId}`,
  );
  return response.data;
}

/**
 * Remove product from watchlist
 */
export async function removeFromWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/api/watchlist/${id}`);
}

function useAddToWatchlist() {
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

function useGetCurrentUserWatchlist({ enabled = true } = {}) {
  return useQuery({ ...currentUserWatchlistQueryOptions(), enabled });
}

function useGetWatchlistItemsByProductApiId(productApiId: string) {
  return useQuery(watchlistItemsByProductQueryOptions(productApiId));
}

function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationKey: OFFLINE_MUTATION_KEYS.watchlistRemove,
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEYS.all });
    },
  });
}

const watchlistService = {
  removeFromWatchlist,
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,
};

export default watchlistService;
