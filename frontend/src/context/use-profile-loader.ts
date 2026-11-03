import { useCallback, useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";

import { UserDto } from "@/lib/api/types";
import { loadUserProfile } from "@/context/load-user-profile";
import {
  erasedAccountId,
  finishErasedAccountDeletion,
} from "@/lib/auth/finish-erased-account";

/** The app profile held in state, and the only way a loaded one reaches it. */
export function useProfileLoader() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedAuth, setHasResolvedAuth] = useState(false);
  const latestProfileLoadRef = useRef(0);

  const refreshUser = useCallback(async () => {
    latestProfileLoadRef.current += 1;
    const profileLoad = latestProfileLoadRef.current;
    // A slower load for the previous account must not replace the current one's profile.
    const isSuperseded = () => profileLoad !== latestProfileLoadRef.current;

    try {
      setIsLoading(true);
      const userData = await loadUserProfile();
      if (isSuperseded()) return undefined;

      setUser(userData);
      return userData;
    } catch (error) {
      if (isSuperseded()) return undefined;

      console.error("Failed to fetch user profile:", error);
      setUser(null);
      // This load is no React Query query, so the query cache's report never sees a drift.
      if (error instanceof ZodError) Sentry.captureException(error);
      // Spring erased this account but the login survived a failed deletion; ending the session
      // lets the session effect clear the tab like any sign-out.
      const erasedUserId = erasedAccountId(error);
      if (erasedUserId) await finishErasedAccountDeletion(erasedUserId);
    } finally {
      if (!isSuperseded()) {
        setIsLoading(false);
        setHasResolvedAuth(true);
      }
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setIsLoading(false);
    setHasResolvedAuth(true);
  }, []);

  return { user, setUser, isLoading, hasResolvedAuth, refreshUser, clearUser };
}
