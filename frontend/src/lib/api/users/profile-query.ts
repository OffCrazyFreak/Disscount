import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { isCancel } from "axios";

import preferencesService from "@/lib/api/preferences";
import { isSessionChanged } from "@/lib/api/problem-details";
import { UserDto } from "@/lib/api/types";
import userService from "@/lib/api/users";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import {
  erasedAccountId,
  finishErasedAccountDeletion,
} from "@/lib/auth/erasure/finish-erased-account";
import { getCacheIdentity } from "@/lib/offline/cache/cache-identity";
import { httpStatus } from "@/lib/offline/writes/failure-policy";
import { isNetworkFailure } from "@/lib/offline/writes/is-network-failure";

function savedProfileOfThisAccount(client: QueryClient): UserDto | undefined {
  const saved = client.getQueryData<UserDto>(USER_QUERY_KEYS.me);
  return saved?.id === getCacheIdentity() ? saved : undefined;
}

function settledOr<T>(
  result: PromiseSettledResult<T>,
  fallback: T | undefined,
) {
  if (result.status === "fulfilled") return result.value;

  console.error("Failed to fetch preferences:", result.reason);
  return fallback;
}

async function loadUserProfile(
  signal: AbortSignal,
  client: QueryClient,
): Promise<UserDto> {
  const userData = await userService.getCurrentUser(signal);

  if (!userData.pinnedStores || !userData.pinnedPlaces) {
    const [stores, places] = await Promise.allSettled([
      preferencesService.getPinnedStores(),
      preferencesService.getPinnedPlaces(),
    ]);
    // Older pins beat none: this answer replaces the saved profile, offline copy included.
    const saved = savedProfileOfThisAccount(client);
    userData.pinnedStores = settledOr(stores, saved?.pinnedStores);
    userData.pinnedPlaces = settledOr(places, saved?.pinnedPlaces);
  }

  return userData;
}

// The request timed out or was throttled; the app's retry policy treats both as passing too.
const PASSING_CLIENT_STATUSES = new Set([408, 429]);

/** The server may answer next time; a refusal or a parse failure would just repeat. */
function isPassingFailure(error: unknown) {
  // Another tab moved the cookie; the session refetch this triggers decides the account, not this refetch.
  if (isNetworkFailure(error) || isSessionChanged(error)) return true;

  const status = httpStatus(error);
  return (
    status !== undefined &&
    (status >= 500 || PASSING_CLIENT_STATUSES.has(status))
  );
}

/** @param accountId The account the session and the cache identity both name; the proxy reads the pin per request. */
export function userProfileQueryOptions(accountId: string | null) {
  return queryOptions({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: async ({ client, signal }): Promise<UserDto> => {
      try {
        return await loadUserProfile(signal, client);
      } catch (error) {
        if (isCancel(error)) throw error;

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
