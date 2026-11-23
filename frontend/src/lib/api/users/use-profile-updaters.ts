import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { PinnedPlaceDto, PinnedStoreDto, UserDto } from "@/lib/api/types";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

/** Writes into the profile query, which the offline snapshot keeps; an updater returning undefined changes nothing. */
export function useProfileUpdaters() {
  const queryClient = useQueryClient();

  const updateProfile = useCallback(
    async (update: (current: UserDto) => UserDto | undefined) => {
      // A refetch that started before the edit would answer with the profile from before it.
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.me });

      queryClient.setQueryData<UserDto>(USER_QUERY_KEYS.me, (current) =>
        // A save answered after another account took over belongs to the previous account.
        current && current.id === getCacheIdentity()
          ? update(current)
          : undefined,
      );
    },
    [queryClient],
  );

  const updatePinnedStores = useCallback(
    (stores: PinnedStoreDto[]) =>
      void updateProfile((current) => ({ ...current, pinnedStores: stores })),
    [updateProfile],
  );

  const updatePinnedPlaces = useCallback(
    (places: PinnedPlaceDto[]) =>
      void updateProfile((current) => ({ ...current, pinnedPlaces: places })),
    [updateProfile],
  );

  const mergeUser = useCallback(
    (patch: Partial<UserDto>) =>
      void updateProfile((current) =>
        patch.id && patch.id !== current.id
          ? undefined
          : { ...current, ...patch },
      ),
    [updateProfile],
  );

  return { updatePinnedStores, updatePinnedPlaces, mergeUser };
}
