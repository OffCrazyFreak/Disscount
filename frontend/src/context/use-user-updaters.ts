import { Dispatch, SetStateAction, useCallback } from "react";

import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";

/** Patches the signed-in user in place; a signed-out user stays null. */
export function useUserUpdaters(
  setUser: Dispatch<SetStateAction<UserDto | null>>,
) {
  const updatePinnedStores = useCallback(
    (stores: PinnedStoreDto[]) => {
      setUser((prev) => (prev ? { ...prev, pinnedStores: stores } : null));
    },
    [setUser],
  );

  const updatePinnedPlaces = useCallback(
    (places: PinnedPlaceDto[]) => {
      setUser((prev) => (prev ? { ...prev, pinnedPlaces: places } : null));
    },
    [setUser],
  );

  const mergeUser = useCallback(
    (patch: Partial<UserDto>) => {
      setUser((prev) => (prev ? { ...prev, ...patch } : null));
    },
    [setUser],
  );

  return { updatePinnedStores, updatePinnedPlaces, mergeUser };
}
