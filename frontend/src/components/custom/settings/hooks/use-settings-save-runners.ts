"use client";

import { userService, preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import type { UserDto } from "@/lib/api/types";
import type { ISaveJobRunners } from "@/components/custom/settings/settings-save-jobs";
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
    uploadAvatar: async (avatar) =>
      mergeUser({
        image: (await uploadAvatarMutation.mutateAsync(avatar)).image,
      }),
    removeAvatar: async () =>
      mergeUser({ image: (await removeAvatarMutation.mutateAsync()).image }),
    saveStores: async (chainCodes) =>
      updatePinnedStores(
        await storesMutation.mutateAsync({
          stores: chainCodes.map((code) => ({
            storeApiId: code,
            storeName: code,
          })),
        }),
      ),
    savePlaces: async (placeKeys) =>
      updatePinnedPlaces(
        await placesMutation.mutateAsync({ places: toPinnedPlaces(placeKeys) }),
      ),
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
