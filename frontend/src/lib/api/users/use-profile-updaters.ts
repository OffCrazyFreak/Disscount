import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ONBOARDING_COMPLETED } from "@/lib/api/schemas/auth-user";
import { PinnedPlaceDto, PinnedStoreDto, UserDto } from "@/lib/api/types";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { getCacheIdentity } from "@/lib/offline/cache-identity";

function isSkipOverCompletion(current: UserDto, patch: Partial<UserDto>) {
  return (
    current.onboardingOutcome === ONBOARDING_COMPLETED &&
    patch.onboardingOutcome !== undefined &&
    patch.onboardingOutcome !== ONBOARDING_COMPLETED
  );
}

/** Writes into the profile query, which the offline snapshot keeps; an updater returning undefined changes nothing. */
export function useProfileUpdaters() {
  const queryClient = useQueryClient();

  const updateProfile = useCallback(
    async (
      update: (current: UserDto) => UserDto | undefined,
      savedFor?: string,
    ) => {
      // A save answered after another account took over belongs to the previous account.
      function applies(current: UserDto | undefined): current is UserDto {
        return (
          current?.id === getCacheIdentity() &&
          (savedFor === undefined || current.id === savedFor) &&
          update(current) !== undefined
        );
      }

      // Checked first, so a save that does not apply never cancels the new account's load.
      if (!applies(queryClient.getQueryData(USER_QUERY_KEYS.me))) return;

      // A refetch that started before the edit would answer with the profile from before it.
      await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.me });

      queryClient.setQueryData<UserDto>(USER_QUERY_KEYS.me, (current) =>
        applies(current) ? update(current) : undefined,
      );
    },
    [queryClient],
  );

  /** @param savedFor The account the save was sent as, since an empty answer names none. */
  const updatePinnedStores = useCallback(
    (stores: PinnedStoreDto[], savedFor?: string) =>
      void updateProfile(
        (current) => ({ ...current, pinnedStores: stores }),
        savedFor,
      ),
    [updateProfile],
  );

  const updatePinnedPlaces = useCallback(
    (places: PinnedPlaceDto[], savedFor?: string) =>
      void updateProfile(
        (current) => ({ ...current, pinnedPlaces: places }),
        savedFor,
      ),
    [updateProfile],
  );

  const mergeUser = useCallback(
    (patch: Partial<UserDto>) =>
      void updateProfile((current) => {
        if (patch.id && patch.id !== current.id) return undefined;
        // A skip sent before the completion can answer after it, and must not reopen the wizard.
        if (isSkipOverCompletion(current, patch)) return undefined;
        return { ...current, ...patch };
      }),
    [updateProfile],
  );

  return { updatePinnedStores, updatePinnedPlaces, mergeUser };
}
