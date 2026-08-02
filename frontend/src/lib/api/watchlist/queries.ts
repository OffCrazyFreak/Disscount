import apiClient from "@/lib/api/api-base";
import { WatchlistItemRequest, WatchlistItemDto } from "@/lib/api/types";

export async function addToWatchlist(
  data: WatchlistItemRequest,
): Promise<WatchlistItemDto> {
  const response = await apiClient.post<WatchlistItemDto>(
    "/api/watchlist",
    data,
  );
  return response.data;
}

export async function getCurrentUserWatchlist(): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<WatchlistItemDto[]>("/api/watchlist/me");
  return response.data;
}

/** A product can be watched more than once, with a different watch type each time. */
export async function getWatchlistItemsByProductApiId(
  productApiId: string,
): Promise<WatchlistItemDto[]> {
  const response = await apiClient.get<WatchlistItemDto[]>(
    `/api/watchlist/product/${productApiId}`,
  );
  return response.data;
}

export async function removeFromWatchlist(id: string): Promise<void> {
  await apiClient.delete(`/api/watchlist/${id}`);
}
