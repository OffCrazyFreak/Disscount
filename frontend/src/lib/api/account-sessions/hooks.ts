import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAccountSessions,
  revokeAccountSession,
} from "@/lib/api/account-sessions/queries";
import { ACCOUNT_SESSION_QUERY_KEYS } from "@/lib/api/account-sessions/keys";

function accountSessionsQueryOptions(currentSessionId: string | undefined) {
  return queryOptions({
    queryKey: ACCOUNT_SESSION_QUERY_KEYS.list(currentSessionId),
    queryFn: getAccountSessions,
  });
}

export function useAccountSessions(
  currentSessionId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    ...accountSessionsQueryOptions(currentSessionId),
    enabled: enabled && !!currentSessionId,
  });
}

export function useRevokeAccountSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeAccountSession,
    // Not on the offline allowlist: a sign-out must reach the server or visibly fail.
    networkMode: "always",
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: ACCOUNT_SESSION_QUERY_KEYS.all,
      }),
  });
}
