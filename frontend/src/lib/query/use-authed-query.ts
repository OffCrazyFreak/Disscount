"use client";

import {
  useIsRestoring,
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

import { useUser } from "@/context/user-context";

export type AuthedQueryResult<TData, TError> = UseQueryResult<TData, TError> & {
  /** Show the skeleton. Covers auth resolution and cache restore, not just the fetch. */
  pending: boolean;
  /** Auth resolved to no session: show the login gate, not an error. */
  requiresAuth: boolean;
};

/**
 * A query that only runs for a signed-in user, and reports its state in the
 * three forms a page actually branches on.
 *
 * Every authenticated page used to hand-write the same three things: fold
 * `isAuthenticated` into `enabled`, merge `userLoading || isLoading` into one
 * flag, and separately decide when to show the login gate. Merging on
 * `isLoading` was also load-bearing by accident, since a disabled query reports
 * `isLoading: false`, so the gate only held while `userLoading` was still true.
 *
 * It reads useUser, which is why it lives here rather than in lib/api: the fetch
 * layer stays free of React context.
 *
 * Fetching starts on the session, not the loaded profile. An authed request only
 * needs a session to be authorised, and the session resolves a round trip before
 * /api/users/me returns, so gating on the profile made every authed page wait
 * out a request it did not depend on. The two now run in parallel.
 *
 * `pending` still waits for the profile, deliberately. Several surfaces derive
 * from user.pinnedStores (the watchlist sorts on it), so painting rows before it
 * lands would reorder them under the reader. Waiting to paint costs nothing here
 * because the fetch already started: total time is the slower of the two rather
 * than their sum.
 */
export function useAuthedQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): AuthedQueryResult<TData, TError> {
  const { hasSession, isLoading: authPending } = useUser();
  const isRestoring = useIsRestoring();

  // No session short-circuits to false; with one, forward whatever the caller
  // set, including the predicate form, which React Query resolves itself.
  const query = useQuery({
    ...options,
    enabled: hasSession ? options.enabled : false,
  });

  // The predicate form cannot be evaluated here, so it counts as enabled. Every
  // option factory in lib/api uses the boolean form.
  const callerEnabled =
    typeof options.enabled === "boolean" ? options.enabled : true;
  const enabled = hasSession && callerEnabled;

  return {
    ...query,
    // A disabled query stays pending forever, so that only counts while enabled.
    pending: authPending || isRestoring || (enabled && query.isPending),
    // Keyed on the session, so a profile fetch that fails surfaces as an error
    // rather than telling a signed-in reader to sign in.
    requiresAuth: !authPending && !hasSession,
  };
}
