import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BulkPinnedPlaceRequest,
  BulkPinnedStoreRequest,
  PinnedPlaceDto,
  PinnedStoreDto,
} from "@/lib/api/types";
import { PREFERENCES_QUERY_KEYS } from "@/lib/api/preferences/keys";
import {
  getPinnedPlaces,
  getPinnedStores,
  updatePinnedPlaces,
  updatePinnedStores,
} from "@/lib/api/preferences/queries";

export const preferencesQueries = {
  pinnedStores: () =>
    queryOptions({
      queryKey: PREFERENCES_QUERY_KEYS.pinnedStores,
      queryFn: getPinnedStores,
    }),

  pinnedPlaces: () =>
    queryOptions({
      queryKey: PREFERENCES_QUERY_KEYS.pinnedPlaces,
      queryFn: getPinnedPlaces,
    }),
};

export function useUpdatePinnedStores() {
  const queryClient = useQueryClient();
  return useMutation<PinnedStoreDto[], Error, BulkPinnedStoreRequest>({
    mutationFn: updatePinnedStores,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCES_QUERY_KEYS.pinnedStores,
      });
    },
  });
}

export function useUpdatePinnedPlaces() {
  const queryClient = useQueryClient();
  return useMutation<PinnedPlaceDto[], Error, BulkPinnedPlaceRequest>({
    mutationFn: updatePinnedPlaces,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PREFERENCES_QUERY_KEYS.pinnedPlaces,
      });
    },
  });
}
