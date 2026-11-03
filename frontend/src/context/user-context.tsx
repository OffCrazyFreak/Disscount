"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";

import { authClient, useSession } from "@/lib/auth/client";
import {
  ANONYMOUS_IDENTITY,
  getCacheIdentity,
  persistedCacheIdentity,
  subscribeToCacheIdentity,
} from "@/lib/offline/cache-identity";
import { sessionIdentity } from "@/lib/auth/pending-sign-out";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { loadUserProfile } from "@/context/load-user-profile";
import {
  erasedAccountId,
  finishErasedAccountDeletion,
} from "@/lib/auth/finish-erased-account";
import { mergeSessionUser } from "@/context/merge-session-user";
import {
  isUnverifiedAccount,
  syncCacheIdentity,
} from "@/context/sync-cache-identity";
import { useLogout } from "@/context/use-logout";
import { useUserUpdaters } from "@/context/use-user-updaters";

interface IUserContext {
  user: UserDto | null;
  isLoading: boolean;
  /** True only until auth first resolves; stays false through later refreshes */
  isInitializing: boolean;
  isAuthenticated: boolean;
  /**
   * The session could not be checked (offline) while this device's offline cache still
   * belongs to an account, so screens may show that saved data until the check passes.
   */
  hasUnverifiedAccount: boolean;
  /** Signed in, or an unverified account: the account's saved data may be shown. */
  canShowAccountData: boolean;
  refreshUser: () => Promise<UserDto | undefined>;
  setUser: (user: UserDto | null) => void;
  /**
   * Folds a profile response into the current user instead of replacing it.
   * The backend's convertToUserDto omits pinnedStores and pinnedPlaces, so a
   * wholesale setUser after any profile PATCH drops them until a hard reload.
   */
  mergeUser: (patch: Partial<UserDto>) => void;
  logout: () => Promise<void>;
  updatePinnedStores: (stores: PinnedStoreDto[]) => void;
  updatePinnedPlaces: (places: PinnedPlaceDto[]) => void;
  handleUserLogin: () => Promise<void>;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

interface IUserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: IUserProviderProps) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResolvedAuth, setHasResolvedAuth] = useState(false);
  // Seeded from the persisted value so a reload as the same account is not read as a
  // change of identity, which would purge the cache it just restored.
  const cacheIdentityRef = useRef<string | null>(persistedCacheIdentity());

  const queryClient = useQueryClient();
  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = useSession();

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await loadUserProfile();

      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      // Spring erased this account but the login survived a failed deletion; ending the session
      // lets the session effect clear the tab like any sign-out.
      const erasedUserId = erasedAccountId(error);
      if (erasedUserId) await finishErasedAccountDeletion(erasedUserId);
    } finally {
      setIsLoading(false);
      setHasResolvedAuth(true);
    }
  }, []);

  useEffect(() => {
    if (sessionPending) return;

    const identity = sessionIdentity(session, sessionError);

    syncCacheIdentity(queryClient, cacheIdentityRef, identity, sessionError);
    // A failed lookup leaves the account unknown, as it does for the cache purge.
    if (!sessionError || identity) {
      // The account id only: email and name stay out of Sentry.
      Sentry.setUser(identity ? { id: identity } : null);
    }

    // The directive covers this whole effect, not just the line under it: the else
    // branch clears user state synchronously too. Both sides react to an auth result
    // that only exists after the session resolves, so neither is derivable.
    if (identity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshUser();
    } else {
      setUser(null);
      setIsLoading(false);
      setHasResolvedAuth(true);
    }
    // Keyed on the user id, not the user object the lint asks for: better-auth hands
    // back a new session object on every poll, so depending on it would refetch the
    // profile on a cadence rather than on a real sign-in or sign-out. The purge itself
    // is guarded by the identity check above, so it would not re-fire either way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.user?.id,
    sessionPending,
    sessionError,
    refreshUser,
    queryClient,
  ]);

  const handleLogout = useLogout(cacheIdentityRef, setUser, session?.user?.id);

  // Called by login/signup forms after signIn/signUp succeeds to eagerly load the profile
  const handleUserLogin = useCallback(async () => {
    // The backend proxy refuses a call pinned to another account than the cookie's, and
    // useSession may not have seen the sign-in yet, so the pin moves to the new account first.
    const { data, error } = await authClient.getSession();
    syncCacheIdentity(
      queryClient,
      cacheIdentityRef,
      data?.user?.id ?? null,
      error,
    );
    await refreshUser();
  }, [queryClient, refreshUser]);

  const { updatePinnedStores, updatePinnedPlaces, mergeUser } =
    useUserUpdaters(setUser);

  const cacheIdentity = useSyncExternalStore(
    subscribeToCacheIdentity,
    getCacheIdentity,
    () => ANONYMOUS_IDENTITY,
  );
  const mergedUser = mergeSessionUser(user, session?.user);
  const hasUnverifiedAccount = isUnverifiedAccount(
    !!mergedUser,
    sessionPending,
    sessionError,
    cacheIdentity,
  );

  const value: IUserContext = {
    user: mergedUser,
    isLoading: isLoading || sessionPending,
    isInitializing: !hasResolvedAuth,
    isAuthenticated: !!mergedUser,
    hasUnverifiedAccount,
    canShowAccountData: !!mergedUser || hasUnverifiedAccount,
    refreshUser,
    setUser,
    mergeUser,
    logout: handleLogout,
    updatePinnedStores,
    updatePinnedPlaces,
    handleUserLogin,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
