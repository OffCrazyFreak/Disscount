import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PREFERENCE_QUERY_KEYS } from "@/lib/api/preferences/keys";
import {
  getPinnedPlaces,
  getPinnedStores,
  updatePinnedPlaces,
  updatePinnedStores,
} from "@/lib/api/preferences/queries";
import {
  BulkPinnedPlaceRequest,
  BulkPinnedStoreRequest,
  PinnedPlaceDto,
  PinnedStoreDto,
} from "@/lib/api/types";

function pinnedStoresQueryOptions() {
  return queryOptions({
    queryKey: PREFERENCE_QUERY_KEYS.pinnedStores,
    queryFn: getPinnedStores,
  });
}

export function useGetPinnedStores({ enabled = true } = {}) {
  return useQuery({ ...pinnedStoresQueryOptions(), enabled });
}

export function useUpdatePinnedStores() {
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

export function useGetPinnedPlaces({ enabled = true } = {}) {
  return useQuery({ ...pinnedPlacesQueryOptions(), enabled });
}

export function useUpdatePinnedPlaces() {
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
