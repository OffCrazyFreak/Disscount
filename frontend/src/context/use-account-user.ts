import { useEffect } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { UserDto } from "@/lib/api/types";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import {
  canWriteAfterPurges,
  currentPurgeGeneration,
} from "@/lib/offline/purge-gate";

/**
 * The signed-in user, or for an unverified account the profile this device last loaded,
 * kept in the offline snapshot. Offline the profile request fails, so without it the
 * account's pinned stores, name and avatar are gone. The logout purge clears the copy.
 */
export function useAccountUser(
  user: UserDto | null,
  hasUnverifiedAccount: boolean,
): UserDto | null {
  const queryClient = useQueryClient();
  // Never fetched: the user context loads the profile, this only reads back its copy.
  const { data } = useQuery<UserDto>({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: skipToken,
  });

  useEffect(() => {
    if (!user) return;

    // A purge fired on an account switch resets this key after its first await, so a
    // profile saved before it finishes is wiped and the avatar is blank offline.
    const generation = currentPurgeGeneration();
    let isCurrent = true;

    void canWriteAfterPurges(generation).then((canWrite) => {
      // A session switch from another tab moves the identity before this account's
      // profile is replaced, and the old one must not be saved as the new account's.
      if (canWrite && isCurrent && user.id === getCacheIdentity()) {
        queryClient.setQueryData(USER_QUERY_KEYS.me, user);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [queryClient, user]);

  if (user) return user;
  return hasUnverifiedAccount ? (data ?? null) : null;
}
