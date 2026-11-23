import { queryOptions, type QueryClient } from "@tanstack/react-query";

import preferencesService from "@/lib/api/preferences";
import { UserDto } from "@/lib/api/types";
import userService from "@/lib/api/users";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import {
  erasedAccountId,
  finishErasedAccountDeletion,
} from "@/lib/auth/finish-erased-account";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { httpStatus } from "@/lib/offline/failure-policy";
import { isNetworkFailure } from "@/lib/offline/is-network-failure";

async function loadUserProfile(signal: AbortSignal): Promise<UserDto> {
  const userData = await userService.getCurrentUser(signal);

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

/** The server may answer next time; a refusal or a parse failure would just repeat. */
function isPassingFailure(error: unknown) {
  if (isNetworkFailure(error)) return true;

  const status = httpStatus(error);
  return status !== undefined && status >= 500;
}

function savedProfileOfThisAccount(client: QueryClient): UserDto | undefined {
  const saved = client.getQueryData<UserDto>(USER_QUERY_KEYS.me);
  return saved?.id === getCacheIdentity() ? saved : undefined;
}

/** @param accountId The account the session and the cache identity both name; the proxy reads the pin per request. */
export function userProfileQueryOptions(accountId: string | null) {
  return queryOptions({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: async ({ client, signal }): Promise<UserDto> => {
      try {
        return await loadUserProfile(signal);
      } catch (error) {
        // A failed entry leaves the snapshot, so an outage would cost the offline copy (TanStack discussion 8696).
        const saved = isPassingFailure(error)
          ? savedProfileOfThisAccount(client)
          : undefined;
        if (saved) return saved;

        console.error("Failed to fetch user profile:", error);
        // Spring erased this account but the login survived, so ending the session clears the tab.
        const erasedUserId = erasedAccountId(error);
        if (erasedUserId) await finishErasedAccountDeletion(erasedUserId);
        throw error;
      }
    },
    enabled: accountId !== null,
  });
}
