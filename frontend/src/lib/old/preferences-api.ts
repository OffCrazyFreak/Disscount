import apiClient from "@/lib/old/api-base";
import {
  PinnedStoreDto,
  PinnedPlaceDto,
  BulkPinnedStoreRequest,
  BulkPinnedPlaceRequest,
} from "@/lib/old/api-types";

export const preferencesApi = {
  // Get current user's pinned stores
  getCurrentUserPinnedStores: async (): Promise<PinnedStoreDto[]> => {
    const response = await apiClient.get("/api/pinned-stores/me");
    return response.data;
  },

  // Get current user's pinned places
  getCurrentUserPinnedPlaces: async (): Promise<PinnedPlaceDto[]> => {
    const response = await apiClient.get("/api/pinned-places/me");
    return response.data;
  },

  // Update pinned stores
  updatePinnedStores: async (storeIds: string[]): Promise<PinnedStoreDto[]> => {
    // Import mock stores to get store names
    const { mockStores } = await import("./mock-data");

    const bulkRequest: BulkPinnedStoreRequest = {
      stores: storeIds.map((storeId) => {
        const store = mockStores.find((s) => s.id === storeId);
        return {
          storeApiId: storeId,
          storeName: store?.name || storeId,
        };
      }),
    };
    const response = await apiClient.post(
      "/api/pinned-stores/bulk",
      bulkRequest
    );
    return response.data;
  },

  // Update pinned places
  updatePinnedPlaces: async (placeIds: string[]): Promise<PinnedPlaceDto[]> => {
    // Import mock locations to get place names
    const { mockLocations } = await import("./mock-data");

    const bulkRequest: BulkPinnedPlaceRequest = {
      places: placeIds.map((placeId) => {
        const location = mockLocations.find((l) => l.id === placeId);
        return {
          placeApiId: placeId,
          placeName: location?.name || placeId,
        };
      }),
    };
    const response = await apiClient.post(
      "/api/pinned-places/bulk",
      bulkRequest
    );
    return response.data;
  },
};
