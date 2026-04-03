import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api-base";
import { WatchlistItemRequest, WatchlistItemDto } from "../types";

// Query key constants
export const WATCHLIST_QUERY_KEYS = {
  all: ["watchlist"] as const,
  me: ["watchlist", "me"] as const,
  byProduct: (productApiId: string) =>
    ["watchlist", "product", productApiId] as const,
};

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
export async function getCurrentUserWatchlist(): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<WatchlistItemDto[]>("/api/watchlist/me");
  return response.data;
}

/**
 * Get watchlist items by product API ID (EAN)
 * Returns all watchlist items for this product (can have multiple with different watch types)
 */
export async function getWatchlistItemsByProductApiId(
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

// React Query hooks

export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<WatchlistItemDto, Error, WatchlistItemRequest>({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEYS.all });
    },
  });
}

export function useGetCurrentUserWatchlist() {
  return useQuery<WatchlistItemDto[], Error>({
    queryKey: WATCHLIST_QUERY_KEYS.me,
    queryFn: getCurrentUserWatchlist,
  });
}

export function useGetWatchlistItemsByProductApiId(productApiId: string) {
  return useQuery<WatchlistItemDto[], Error>({
    queryKey: WATCHLIST_QUERY_KEYS.byProduct(productApiId),
    queryFn: () => getWatchlistItemsByProductApiId(productApiId),
    enabled: !!productApiId,
  });
}

export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_QUERY_KEYS.all });
    },
  });
}

// Service object with all functions and hooks
const watchlistService = {
  // API functions
  addToWatchlist,
  getCurrentUserWatchlist,
  getWatchlistItemsByProductApiId,
  removeFromWatchlist,

  // React Query hooks
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,

  // Query keys
  QUERY_KEYS: WATCHLIST_QUERY_KEYS,
};

export default watchlistService;
