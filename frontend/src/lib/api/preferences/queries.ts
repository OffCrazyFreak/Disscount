import apiClient from "@/lib/api/api-base";
import {
  BulkPinnedPlaceRequest,
  BulkPinnedStoreRequest,
  PinnedPlaceDto,
  PinnedStoreDto,
} from "@/lib/api/types";

export async function getPinnedStores(): Promise<PinnedStoreDto[]> {
  const response = await apiClient.get<PinnedStoreDto[]>(
    "/api/pinned-stores/me",
  );
  return response.data;
}

export async function updatePinnedStores(
  data: BulkPinnedStoreRequest,
): Promise<PinnedStoreDto[]> {
  const response = await apiClient.put<PinnedStoreDto[]>(
    "/api/pinned-stores/bulk",
    data,
  );
  return response.data;
}

export async function getPinnedPlaces(): Promise<PinnedPlaceDto[]> {
  const response = await apiClient.get<PinnedPlaceDto[]>(
    "/api/pinned-places/me",
  );
  return response.data;
}

export async function updatePinnedPlaces(
  data: BulkPinnedPlaceRequest,
): Promise<PinnedPlaceDto[]> {
  const response = await apiClient.put<PinnedPlaceDto[]>(
    "/api/pinned-places/bulk",
    data,
  );
  return response.data;
}
