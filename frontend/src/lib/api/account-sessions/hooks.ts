import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAccountSessions,
  revokeAccountSession,
} from "@/lib/api/account-sessions/queries";

export const ACCOUNT_SESSION_QUERY_KEYS = {
  all: ["account-sessions"] as const,
  // Keyed on this device's session, because a re-auth proof swaps it for a new id.
  list: (currentSessionId: string | undefined) =>
    ["account-sessions", currentSessionId] as const,
};

export function useAccountSessions(
  currentSessionId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ACCOUNT_SESSION_QUERY_KEYS.list(currentSessionId),
    queryFn: getAccountSessions,
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
