"use client";

import { userService, preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import type { UserDto } from "@/lib/api/types";
import type { ISaveJobRunners } from "@/components/custom/settings/settings-save-jobs";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { toPinnedPlaces } from "@/utils/place-options";

function withoutImage(user: UserDto): Partial<UserDto> {
  const profile: Partial<UserDto> = { ...user };
  delete profile.image;

  return profile;
}

export function useSettingsSaveRunners() {
  const { mergeUser, updatePinnedStores, updatePinnedPlaces } = useUser();

  const userMutation = userService.useUpdateCurrentUser();
  const uploadAvatarMutation = userService.useUploadAvatar();
  const removeAvatarMutation = userService.useRemoveAvatar();
  const storesMutation = preferencesService.useUpdatePinnedStores();
  const placesMutation = preferencesService.useUpdatePinnedPlaces();

  const runners: ISaveJobRunners = {
    // Merged without pins or image: the stores and avatar jobs race this one and own those fields.
    saveUser: async (patch) =>
      mergeUser(withoutImage(await userMutation.mutateAsync(patch))),
    // The id lets mergeUser drop an answer that lands after another account took over.
    uploadAvatar: async (avatar) => {
      const { id, image } = await uploadAvatarMutation.mutateAsync(avatar);
      mergeUser({ id, image });
    },
    removeAvatar: async () => {
      const { id, image } = await removeAvatarMutation.mutateAsync();
      mergeUser({ id, image });
    },
    // Captured before the request, because an empty answer names no account.
    saveStores: async (chainCodes) => {
      const savedFor = getCacheIdentity();
      const stores = await storesMutation.mutateAsync({
        stores: chainCodes.map((code) => ({
          storeApiId: code,
          storeName: code,
        })),
      });
      updatePinnedStores(stores, savedFor);
    },
    savePlaces: async (placeKeys) => {
      const savedFor = getCacheIdentity();
      const places = await placesMutation.mutateAsync({
        places: toPinnedPlaces(placeKeys),
      });
      updatePinnedPlaces(places, savedFor);
    },
  };

  return {
    runners,
    saving:
      userMutation.isPending ||
      uploadAvatarMutation.isPending ||
      removeAvatarMutation.isPending ||
      storesMutation.isPending ||
      placesMutation.isPending,
  };
}
