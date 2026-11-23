import { Dispatch, SetStateAction, useCallback } from "react";

import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";

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
      setUser((prev) => {
        if (!prev) return null;
        // A save answered after another account took over belongs to the previous account.
        if (patch.id && patch.id !== prev.id) return prev;
        return { ...prev, ...patch };
      });
    },
    [setUser],
  );

  return { updatePinnedStores, updatePinnedPlaces, mergeUser };
}
