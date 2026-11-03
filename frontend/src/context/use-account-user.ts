import { useEffect } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { UserDto } from "@/lib/api/types";

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
    if (user) queryClient.setQueryData(USER_QUERY_KEYS.me, user);
  }, [queryClient, user]);

  if (user) return user;
  return hasUnverifiedAccount ? (data ?? null) : null;
}
