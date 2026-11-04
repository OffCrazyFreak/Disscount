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
  // On a change of identity only: purging anonymous loads would drop offline writes, and a failed lookup offline is not a logout.
  if (sessionError || identity === cacheIdentityRef.current) return;

  // Before the purge, which would delete the guest's drafts as the departing identity's.
  if (cacheIdentityRef.current === null && identity !== null) {
    adoptGuestFormDrafts(identity);
  }

  // The departing identity, because setCacheIdentity below runs first and a key resolved inside the purge would name the arriving account.
  void purgeOfflineCache(
    queryClient,
    toCacheIdentity(cacheIdentityRef.current),
  );
  setCacheIdentity(identity);
  cacheIdentityRef.current = identity;
}
