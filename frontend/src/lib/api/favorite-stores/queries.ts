import apiClient from "@/lib/api/api-base";
import {
  favoriteStoreDtoSchema,
  type BulkFavoriteStoreRequest,
  type FavoriteStoreDto,
} from "@/lib/api/types";

export async function getFavoriteStores(): Promise<FavoriteStoreDto[]> {
  const response = await apiClient.get<unknown[]>("/api/favorite-stores/me");
  return response.data.map((item) => favoriteStoreDtoSchema.parse(item));
}

/** Replaces the whole list, like pinned places. */
export async function updateFavoriteStores(
  data: BulkFavoriteStoreRequest,
): Promise<FavoriteStoreDto[]> {
  const response = await apiClient.put<unknown[]>(
    "/api/favorite-stores/bulk",
    data,
  );
  return response.data.map((item) => favoriteStoreDtoSchema.parse(item));
}
