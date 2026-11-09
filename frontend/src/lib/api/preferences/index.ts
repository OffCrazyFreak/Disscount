import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import { PREFERENCE_QUERY_KEYS } from "@/lib/api/preferences/keys";
import {
  BulkPinnedPlaceRequest,
  BulkPinnedStoreRequest,
  PinnedPlaceDto,
  PinnedStoreDto,
} from "@/lib/api/types";

async function getPinnedStores(): Promise<PinnedStoreDto[]> {
  const response = await apiClient.get<PinnedStoreDto[]>(
    "/api/pinned-stores/me",
  );
  return response.data;
}

async function updatePinnedStores(
  data: BulkPinnedStoreRequest,
): Promise<PinnedStoreDto[]> {
  const response = await apiClient.put<PinnedStoreDto[]>(
    "/api/pinned-stores/bulk",
    data,
  );
  return response.data;
}

async function getPinnedPlaces(): Promise<PinnedPlaceDto[]> {
  const response = await apiClient.get<PinnedPlaceDto[]>(
    "/api/pinned-places/me",
  );
  return response.data;
}

async function updatePinnedPlaces(
  data: BulkPinnedPlaceRequest,
): Promise<PinnedPlaceDto[]> {
  const response = await apiClient.put<PinnedPlaceDto[]>(
    "/api/pinned-places/bulk",
    data,
  );
  return response.data;
}

function pinnedStoresQueryOptions() {
  return queryOptions({
    queryKey: PREFERENCE_QUERY_KEYS.pinnedStores,
    queryFn: getPinnedStores,
  });
}

function useGetPinnedStores({ enabled = true } = {}) {
  return useQuery({ ...pinnedStoresQueryOptions(), enabled });
}

function useUpdatePinnedStores() {
  const queryClient = useQueryClient();
  return useMutation<PinnedStoreDto[], Error, BulkPinnedStoreRequest>({
    mutationFn: updatePinnedStores,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCE_QUERY_KEYS.pinnedStores,
      });
    },
  });
}

function pinnedPlacesQueryOptions() {
  return queryOptions({
    queryKey: PREFERENCE_QUERY_KEYS.pinnedPlaces,
    queryFn: getPinnedPlaces,
  });
}

function useGetPinnedPlaces({ enabled = true } = {}) {
  return useQuery({ ...pinnedPlacesQueryOptions(), enabled });
}

function useUpdatePinnedPlaces() {
  const queryClient = useQueryClient();
  return useMutation<PinnedPlaceDto[], Error, BulkPinnedPlaceRequest>({
    mutationFn: updatePinnedPlaces,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCE_QUERY_KEYS.pinnedPlaces,
      });
    },
  });
}

const preferencesService = {
  getPinnedStores,
  getPinnedPlaces,
  useGetPinnedStores,
  useUpdatePinnedStores,
  useGetPinnedPlaces,
  useUpdatePinnedPlaces,
};

export default preferencesService;
