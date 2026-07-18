"use client";

import { useMemo } from "react";

import { preferencesService } from "@/lib/api";
import { useUser } from "@/context/user-context";
import { SettingsFormValues } from "@/components/custom/settings/settings-schema";

/**
 * Builds the settings form's server baseline. Pinned data prefers the user
 * context and falls back to the preferences queries; stores map to their
 * CHAIN CODES (storeApiId), fixing the old load-names/save-codes mismatch.
 */
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
      // Push, email and newsletter are coming-soon placeholders (disabled in
      // the UI), so they show a fixed default rather than the stored flag.
      notificationsPush: true,
      notificationsEmail: false,
      newsletter: true,
      feedbackContact: !!user?.feedbackContactEnabledAt,
      pinnedStores: pinnedStores.map((store) => store.storeApiId),
      pinnedPlaces: pinnedPlaces.map((place) => place.placeName),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, storesQuery.data, placesQuery.data]
  );

  const isReady =
    !!user && (!needsPins || (!storesQuery.isLoading && !placesQuery.isLoading));

  return { defaults, isReady };
}
