import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { PinnedPlaceDto, PinnedStoreDto, UserDto } from "@/lib/api/types";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

/** Writes into the profile query, which is also the profile the offline snapshot keeps. */
export function useProfileUpdaters() {
  const queryClient = useQueryClient();

  const updateProfile = useCallback(
    (update: (current: UserDto) => UserDto) => {
      queryClient.setQueryData<UserDto>(USER_QUERY_KEYS.me, (current) =>
        // A save answered after another account took over belongs to the previous account.
        current && current.id === getCacheIdentity()
          ? update(current)
          : current,
      );
    },
    [queryClient],
  );

  const updatePinnedStores = useCallback(
    (stores: PinnedStoreDto[]) =>
      updateProfile((current) => ({ ...current, pinnedStores: stores })),
    [updateProfile],
  );

  const updatePinnedPlaces = useCallback(
    (places: PinnedPlaceDto[]) =>
      updateProfile((current) => ({ ...current, pinnedPlaces: places })),
    [updateProfile],
  );

  const mergeUser = useCallback(
    (patch: Partial<UserDto>) =>
      updateProfile((current) =>
        patch.id && patch.id !== current.id
          ? current
          : { ...current, ...patch },
      ),
    [updateProfile],
  );

  return { updatePinnedStores, updatePinnedPlaces, mergeUser };
}
