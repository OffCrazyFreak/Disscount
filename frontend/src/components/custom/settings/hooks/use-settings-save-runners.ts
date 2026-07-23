"use client";

import { userService, preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import type { ISaveJobRunners } from "@/components/custom/settings/settings-save-jobs";

export function useSettingsSaveRunners() {
  const { setUser, updatePinnedStores, updatePinnedPlaces } = useUser();

  const userMutation = userService.useUpdateCurrentUser();
  const storesMutation = preferencesService.useUpdatePinnedStores();
  const placesMutation = preferencesService.useUpdatePinnedPlaces();

  const runners: ISaveJobRunners = {
    saveUser: async (patch) => setUser(await userMutation.mutateAsync(patch)),
    saveStores: async (chainCodes) =>
      updatePinnedStores(
        await storesMutation.mutateAsync({
          stores: chainCodes.map((code) => ({
            storeApiId: code,
            storeName: code,
          })),
        }),
      ),
    savePlaces: async (placeNames) =>
      updatePinnedPlaces(
        await placesMutation.mutateAsync({
          places: placeNames.map((placeName) => ({
            placeApiId: placeName,
            placeName,
          })),
        }),
      ),
  };

  return {
    runners,
    saving:
      userMutation.isPending ||
      storesMutation.isPending ||
      placesMutation.isPending,
  };
}
