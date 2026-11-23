import preferencesService from "@/lib/api/preferences";
import { UserDto } from "@/lib/api/types";
import userService from "@/lib/api/users";

export async function loadUserProfile(): Promise<UserDto> {
  const userData = await userService.getCurrentUser();

  if (!userData.pinnedStores || !userData.pinnedPlaces) {
    try {
      const [stores, places] = await Promise.all([
        preferencesService.getPinnedStores(),
        preferencesService.getPinnedPlaces(),
      ]);
      userData.pinnedStores = stores;
      userData.pinnedPlaces = places;
    } catch (prefError) {
      console.error("Failed to fetch preferences:", prefError);
    }
  }

  return userData;
}
