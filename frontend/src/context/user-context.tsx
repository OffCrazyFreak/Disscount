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
  /** Stays false through refreshes of the same account. */
  isInitializing: boolean;
  isAuthenticated: boolean;
  /** Offline, with the cache still belonging to an account, screens may show that saved data until the check passes. */
  hasUnverifiedAccount: boolean;
  /** Signed in, or an unverified account: the account's saved data may be shown. */
  canShowAccountData: boolean;
  /** For showing the account and its preferences only, never for acting on it. */
  accountUser: UserDto | null;
  refreshUser: () => Promise<UserDto | undefined>;
  setUser: (user: UserDto | null) => void;
  /** Folds because convertToUserDto omits pinnedStores and pinnedPlaces, which setUser would drop. */
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
  // Seeded so a reload as the same account is no identity change, which would purge the restored cache.
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

    // Both sides react to an auth result that only exists after the session resolves, so neither is derivable.
    if (identity) {
      refreshUser();
    } else {
      clearUser();
    }
    // Keyed on the id because better-auth returns a new session object on every poll.
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

  const handleUserLogin = useCallback(async () => {
    // The proxy refuses a pin differing from the cookie, and useSession may lag, so the pin moves first.
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
