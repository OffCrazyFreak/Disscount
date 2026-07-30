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
 */
export function useAuthedQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): AuthedQueryResult<TData, TError> {
  const { isAuthenticated, isLoading: authPending } = useUser();
  const isRestoring = useIsRestoring();

  // Signed out short-circuits to false; signed in forwards whatever the caller
  // set, including the predicate form, which React Query resolves itself.
  const query = useQuery({
    ...options,
    enabled: isAuthenticated ? options.enabled : false,
  });

  // The predicate form cannot be evaluated here, so it counts as enabled. Every
  // option factory in lib/api uses the boolean form.
  const callerEnabled =
    typeof options.enabled === "boolean" ? options.enabled : true;
  const enabled = isAuthenticated && callerEnabled;

  return {
    ...query,
    // A disabled query stays pending forever, so that only counts while enabled.
    pending: authPending || isRestoring || (enabled && query.isPending),
    requiresAuth: !authPending && !isAuthenticated,
  };
}
