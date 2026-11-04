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

/** Purges the offline cache when a resolved session names a different account. */
export function syncCacheIdentity(
  queryClient: QueryClient,
  cacheIdentityRef: RefObject<string | null>,
  identity: string | null,
  sessionError: unknown,
) {
  // Purge on a change of identity, not on every anonymous load. This effect runs on
  // mount, so purging whenever there is no session wiped the cache and the queued
  // write replay on every single page load for a visitor who is not logged in, which
  // silently dropped anything they had ticked off while offline.
  // A failed session lookup is not a logout. /api/auth/get-session is NetworkOnly in
  // the service worker, so offline it rejects and useSession settles to data: null with
  // an error set. Purging on that would wipe the signed-in user's cache and every
  // queued write on the first offline reload, which is the failure this branch exists
  // to prevent.
  if (sessionError || identity === cacheIdentityRef.current) return;

  // Before the purge, which would delete the guest's drafts as the departing identity's.
  if (cacheIdentityRef.current === null && identity !== null) {
    adoptGuestFormDrafts(identity);
  }

  // Pass the departing identity, not the arriving one. The purge awaits an IndexedDB
  // delete, and setCacheIdentity below runs first, so a key resolved inside the purge
  // would name the account that just arrived.
  void purgeOfflineCache(
    queryClient,
    toCacheIdentity(cacheIdentityRef.current),
  );
  setCacheIdentity(identity);
  cacheIdentityRef.current = identity;
}
