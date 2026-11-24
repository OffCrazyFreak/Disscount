"use client";

import { useMemo } from "react";

import { preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";

/** Stores map to their chain codes (storeApiId), because that is what a save writes. */
export function useSettingsDefaults() {
  const { user } = useUser();

  const needsPins = !!user && (!user.pinnedStores || !user.pinnedPlaces);
  const storesQuery = preferencesService.useGetPinnedStores({
    enabled: needsPins,
  });
  const placesQuery = preferencesService.useGetPinnedPlaces({
    enabled: needsPins,
  });

  const pinnedStores = user?.pinnedStores ?? storesQuery.data ?? [];
  const pinnedPlaces = user?.pinnedPlaces ?? placesQuery.data ?? [];

  const defaults: SettingsFormValues = useMemo(
    () => ({
      username: user?.username ?? "",
      acquisitionChannel: user?.acquisitionChannel ?? null,
      notificationsPush: !!user?.notificationsPushEnabledAt,
      notificationsEmail: !!user?.notificationsEmailEnabledAt,
      newsletter: !!user?.newsletterEnabledAt,
      feedbackContact: !!user?.feedbackContactEnabledAt,
      pinnedStores: pinnedStores.map((store) => store.storeApiId),
      pinnedPlaces: pinnedPlaces.map((place) => place.placeApiId),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, storesQuery.data, placesQuery.data],
  );

  const isReady =
    !!user &&
    (!needsPins || (!storesQuery.isLoading && !placesQuery.isLoading));

  return { defaults, isReady };
}
