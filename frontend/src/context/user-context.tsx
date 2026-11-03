"use client";

import {
  createContext,
  useContext,
  useEffect,
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
import {
  isProfileOfAnotherAccount,
  mergeSessionUser,
} from "@/context/merge-session-user";
import {
  isUnverifiedAccount,
  syncCacheIdentity,
} from "@/context/sync-cache-identity";
import { useAccountUser } from "@/context/use-account-user";
import { useLogout } from "@/context/use-logout";
import { useProfileLoader } from "@/context/use-profile-loader";
import { useUserUpdaters } from "@/context/use-user-updaters";

interface IUserContext {
  user: UserDto | null;
  isLoading: boolean;
  /**
   * True until auth first resolves and while a newly signed-in account's profile loads;
   * stays false through refreshes of the same account.
   */
  isInitializing: boolean;
  isAuthenticated: boolean;
  /**
   * The session could not be checked (offline) while this device's offline cache still
   * belongs to an account, so screens may show that saved data until the check passes.
   */
  hasUnverifiedAccount: boolean;
  /** Signed in, or an unverified account: the account's saved data may be shown. */
  canShowAccountData: boolean;
  /**
   * The signed-in user, or for an unverified account the profile this device saved. For
   * showing the account and its preferences (pinned stores) only, never for acting on it.
   */
  accountUser: UserDto | null;
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
  const { user, setUser, isLoading, hasResolvedAuth, refreshUser, clearUser } =
    useProfileLoader();
  // Seeded from the persisted value so a reload as the same account is not read as a
  // change of identity, which would purge the cache it just restored.
  const cacheIdentityRef = useRef<string | null>(persistedCacheIdentity());

  const queryClient = useQueryClient();
  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = useSession();

  useEffect(() => {
    if (sessionPending) return;

    const identity = sessionIdentity(session, sessionError);

    syncCacheIdentity(queryClient, cacheIdentityRef, identity, sessionError);
    // A failed lookup leaves the account unknown, as it does for the cache purge.
    if (!sessionError || identity) {
      // The account id only: email and name stay out of Sentry.
      Sentry.setUser(identity ? { id: identity } : null);
    }

    // Both sides react to an auth result that only exists after the session resolves,
    // so neither is derivable.
    if (identity) {
      refreshUser();
    } else {
      clearUser();
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
    clearUser,
    queryClient,
  ]);

  const handleLogout = useLogout(cacheIdentityRef, setUser);

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
  // Withheld, with the flags reading as loading and never as signed out.
  const isSwitchingAccount = isProfileOfAnotherAccount(user, session?.user);
  const mergedUser = isSwitchingAccount
    ? null
    : mergeSessionUser(user, session?.user);
  const hasUnverifiedAccount = isUnverifiedAccount(
    !!mergedUser,
    sessionPending,
    sessionError,
    cacheIdentity,
  );
  const accountUser = useAccountUser(mergedUser, hasUnverifiedAccount);

  const value: IUserContext = {
    user: mergedUser,
    isLoading: isLoading || sessionPending || isSwitchingAccount,
    isInitializing: !hasResolvedAuth || isSwitchingAccount,
    isAuthenticated: !!mergedUser || isSwitchingAccount,
    hasUnverifiedAccount,
    canShowAccountData:
      !!mergedUser || hasUnverifiedAccount || isSwitchingAccount,
    accountUser,
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
