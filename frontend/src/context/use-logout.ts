import { Dispatch, RefObject, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";

import { usePathname, useRouter } from "@/i18n/navigation";
import { isProtectedRoute } from "@/constants/protected-routes";
import { signOutOrDefer } from "@/lib/auth/pending-sign-out";
import type { UserDto } from "@/lib/api/types";
import {
  getCacheIdentity,
  setCacheIdentity,
} from "@/lib/offline/cache-identity";
import { purgeOfflineCache } from "@/lib/offline/purge";
import { removeFormDraftsFor } from "@/utils/browser/storage/drafts";

export function useLogout(
  cacheIdentityRef: RefObject<string | null>,
  setUser: Dispatch<SetStateAction<UserDto | null>>,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return async function logout() {
    // Read before the request: its answer can move the identity to anonymous first.
    const leavingIdentity = getCacheIdentity();
    await signOutOrDefer();

    Sentry.setUser(null);
    setUser(null);
    await purgeOfflineCache(queryClient, leavingIdentity);
    // Cleared with the data, or the device reads as unverified offline and shows empty pages.
    setCacheIdentity(null);
    cacheIdentityRef.current = null;
    // Again after the purge, because a form unmounted by sign-out flushes its draft during it.
    removeFormDraftsFor(leavingIdentity);
    // Staying on a protected route signed out would just show a login gate.
    if (isProtectedRoute(pathname)) router.push("/");
  };
}
