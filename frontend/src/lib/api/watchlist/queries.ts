import apiClient from "@/lib/api/api-base";
import {
  watchlistItemDtoSchema,
  type WatchlistItemRequest,
  type WatchlistItemDto,
} from "@/lib/api/types";

export async function addToWatchlist(
  data: WatchlistItemRequest,
): Promise<WatchlistItemDto> {
  const response = await apiClient.post<unknown>("/api/watchlist", data);
  return watchlistItemDtoSchema.parse(response.data);
}

export async function getCurrentUserWatchlist(): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<unknown[]>("/api/watchlist/me");
  return response.data.map((item) => watchlistItemDtoSchema.parse(item));
}

export async function getWatchlistItemsByProductApiId(
  productApiId: string,
): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<unknown[]>(
    `/api/watchlist/product/${productApiId}`,
  );
  return response.data.map((item) => watchlistItemDtoSchema.parse(item));
}

export async function removeFromWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/api/watchlist/${id}`);
}
