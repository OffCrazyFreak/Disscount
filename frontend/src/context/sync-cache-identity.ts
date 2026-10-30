import { RefObject } from "react";
import { QueryClient } from "@tanstack/react-query";

import { purgeOfflineCache } from "@/lib/offline/purge";
import {
  getCacheIdentity,
  setCacheIdentity,
  toCacheIdentity,
} from "@/lib/offline/cache-identity";

export function persistedCacheIdentity(): string | null {
  return getCacheIdentity() === "anon" ? null : getCacheIdentity();
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
