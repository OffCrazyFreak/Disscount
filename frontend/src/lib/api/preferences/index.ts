import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api-base";
import {
  BulkPinnedPlaceRequest,
  BulkPinnedStoreRequest,
  PinnedPlaceDto,
  PinnedStoreDto,
} from "../types";

/**
 * Get current user's pinned stores
 */
export const getPinnedStores = async (): Promise<PinnedStoreDto[]> => {
  const response = await apiClient.get<PinnedStoreDto[]>(
    "/api/pinned-stores/me"
  );
  return response.data;
};

/**
 * Update user's pinned stores (bulk operation)
 */
export const updatePinnedStores = async (
  data: BulkPinnedStoreRequest
): Promise<PinnedStoreDto[]> => {
  const response = await apiClient.put<PinnedStoreDto[]>(
    "/api/pinned-stores/bulk",
    data
  );
  return response.data;
};

/**
 * Get current user's pinned places
 */
export const getPinnedPlaces = async (): Promise<PinnedPlaceDto[]> => {
  const response = await apiClient.get<PinnedPlaceDto[]>(
    "/api/pinned-places/me"
  );
  return response.data;
};

/**
 * Update user's pinned places (bulk operation)
 */
export const updatePinnedPlaces = async (
  data: BulkPinnedPlaceRequest
): Promise<PinnedPlaceDto[]> => {
  const response = await apiClient.put<PinnedPlaceDto[]>(
    "/api/pinned-places/bulk",
    data
  );
  return response.data;
};

// React Query hooks
export const useGetPinnedStores = () => {
  return useQuery<PinnedStoreDto[], Error>({
    queryKey: ["pinnedStores"],
    queryFn: getPinnedStores,
  });
};

export const useUpdatePinnedStores = () => {
  const queryClient = useQueryClient();
  return useMutation<PinnedStoreDto[], Error, BulkPinnedStoreRequest>({
    mutationFn: updatePinnedStores,
    onSuccess: () => {
      // Invalidate the pinnedStores query to refetch when needed
      queryClient.invalidateQueries({ queryKey: ["pinnedStores"] });
    },
  });
};

export const useGetPinnedPlaces = () => {
  return useQuery<PinnedPlaceDto[], Error>({
    queryKey: ["pinnedPlaces"],
    queryFn: getPinnedPlaces,
  });
};

export const useUpdatePinnedPlaces = () => {
  const queryClient = useQueryClient();
  return useMutation<PinnedPlaceDto[], Error, BulkPinnedPlaceRequest>({
    mutationFn: updatePinnedPlaces,
    onSuccess: () => {
      // Invalidate the pinnedPlaces query to refetch when needed
      queryClient.invalidateQueries({ queryKey: ["pinnedPlaces"] });
    },
  });
};

const preferencesService = {
  getPinnedStores,
  updatePinnedStores,
  getPinnedPlaces,
  updatePinnedPlaces,
  // React Query hooks
  useGetPinnedStores,
  useUpdatePinnedStores,
  useGetPinnedPlaces,
  useUpdatePinnedPlaces,
};

export default preferencesService;
