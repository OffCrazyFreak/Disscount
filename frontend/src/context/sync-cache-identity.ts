import { RefObject } from "react";
import { QueryClient } from "@tanstack/react-query";

import { purgeOfflineCache } from "@/lib/offline/purge";
import {
  ANONYMOUS_IDENTITY,
  setCacheIdentity,
  toCacheIdentity,
} from "@/lib/offline/cache-identity";
import { adoptGuestFormDrafts } from "@/utils/browser/storage/drafts";

/** A failed lookup is not a sign-out, the rule the cache purge follows too. */
export function isUnverifiedAccount(
  isSignedIn: boolean,
  isSessionPending: boolean,
  sessionError: unknown,
  cacheIdentity: string,
): boolean {
  return (
    !isSignedIn &&
    !isSessionPending &&
    !!sessionError &&
    cacheIdentity !== ANONYMOUS_IDENTITY
  );
}

export function syncCacheIdentity(
  queryClient: QueryClient,
  cacheIdentityRef: RefObject<string | null>,
  identity: string | null,
  sessionError: unknown,
) {
  // Only on an identity change: anonymous purges drop offline writes, and a failed lookup is no logout.
  if (sessionError || identity === cacheIdentityRef.current) return;

  // Before the purge, which would delete the guest's drafts as the departing identity's.
  if (cacheIdentityRef.current === null && identity !== null) {
    adoptGuestFormDrafts(identity);
  }

  // The departing identity, as setCacheIdentity runs first and a later lookup would name the arriving one.
  void purgeOfflineCache(
    queryClient,
    toCacheIdentity(cacheIdentityRef.current),
  );
  setCacheIdentity(identity);
  cacheIdentityRef.current = identity;
}
