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

/** Signs out on the server, or later when offline, and clears the account from the device. */
export function useLogout(
  cacheIdentityRef: RefObject<string | null>,
  setUser: Dispatch<SetStateAction<UserDto | null>>,
  sessionUserId: string | undefined,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  return async function logout() {
    // Read before the request: its answer can move the identity to anonymous first.
    const leavingIdentity = getCacheIdentity();
    await signOutOrDefer(sessionUserId ?? null);

    Sentry.setUser(null);
    setUser(null);
    await purgeOfflineCache(queryClient, leavingIdentity);
    // Cleared with the data: a device still marked as the account reads as its
    // unverified account offline, showing empty pages instead of a login prompt.
    setCacheIdentity(null);
    cacheIdentityRef.current = null;
    // Staying on a protected route signed out would just show a login gate.
    if (isProtectedRoute(pathname)) router.push("/");
  };
}
