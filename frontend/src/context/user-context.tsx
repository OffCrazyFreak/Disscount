"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/nextjs";

import { authClient, useSession } from "@/lib/auth/client";
import {
  ANONYMOUS_IDENTITY,
  getCacheIdentity,
  persistedCacheIdentity,
  subscribeToCacheIdentity,
} from "@/lib/offline/cache/cache-identity";
import { sessionIdentity } from "@/lib/auth/account/pending-sign-out";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { USER_QUERY_KEYS } from "@/lib/api/users/keys";
import { userProfileQueryOptions } from "@/lib/api/users/profile-query";
import { useProfileUpdaters } from "@/lib/api/users/use-profile-updaters";
import { deriveAccountState } from "@/context/user-session/derive-account-state";
import { syncCacheIdentity } from "@/context/user-session/sync-cache-identity";
import { useLogout } from "@/context/user-session/use-logout";

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
  /** Folds because convertToUserDto omits pinnedStores and pinnedPlaces, which a plain replace would drop. */
  mergeUser: (patch: Partial<UserDto>) => void;
  logout: () => Promise<void>;
  /** savedFor: the account the save was sent as, so a late answer for another account is dropped. */
  updatePinnedStores: (stores: PinnedStoreDto[], savedFor?: string) => void;
  updatePinnedPlaces: (places: PinnedPlaceDto[], savedFor?: string) => void;
  handleUserLogin: () => Promise<void>;
}

const UserContext = createContext<IUserContext | undefined>(undefined);

interface IUserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: IUserProviderProps) {
  // Seeded so a reload as the same account is no identity change, which would purge the restored cache.
  const cacheIdentityRef = useRef<string | null>(persistedCacheIdentity());
  // The account the last resolved session names; undefined until the first one resolves.
  const [sessionAccount, setSessionAccount] = useState<string | null>();

  const queryClient = useQueryClient();
  const {
    data: session,
    isPending: sessionPending,
    error: sessionError,
  } = useSession();

  const cacheIdentity = useSyncExternalStore(
    subscribeToCacheIdentity,
    getCacheIdentity,
    () => ANONYMOUS_IDENTITY,
  );
  // Until the pin moves, a profile request would act as the previous account and be refused.
  const accountId =
    sessionAccount && sessionAccount === cacheIdentity ? sessionAccount : null;
  const profileQuery = useQuery(userProfileQueryOptions(accountId));
  const { refetch: refetchProfile } = profileQuery;

  const reloadProfile = useCallback(async () => {
    // A running load with no data yet would be reused, and it acts as the previous account.
    await queryClient.cancelQueries({ queryKey: USER_QUERY_KEYS.me });
    const result = await refetchProfile();
    return result.isSuccess ? result.data : undefined;
  }, [queryClient, refetchProfile]);

  useEffect(() => {
    if (sessionPending) return;

    const identity = sessionIdentity(session, sessionError);
    const previousIdentity = cacheIdentityRef.current;

    syncCacheIdentity(queryClient, cacheIdentityRef, identity, sessionError);
    // A failed lookup leaves the account unknown, as it does for the cache purge.
    if (!sessionError || identity) {
      // The account id only: email and name stay out of Sentry.
      Sentry.setUser(identity ? { id: identity } : null);
    }

    // sessionIdentity can end a pending sign-out, so the resolved account is a result of this effect, not of render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionAccount(identity);
    // The key stays the same across accounts, so a new account has to ask.
    if (identity && cacheIdentityRef.current !== previousIdentity) {
      void reloadProfile();
    }
    // Keyed on the id because better-auth returns a new session object on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session?.user?.id,
    sessionPending,
    sessionError,
    reloadProfile,
    queryClient,
  ]);

  const forgetAccount = useCallback(() => setSessionAccount(null), []);
  const handleLogout = useLogout(cacheIdentityRef, forgetAccount);

  const refreshUser = useCallback(async () => {
    const result = await refetchProfile();
    return result.isSuccess ? result.data : undefined;
  }, [refetchProfile]);

  const handleUserLogin = useCallback(async () => {
    // The proxy refuses a pin differing from the cookie, and useSession may lag, so the pin moves first.
    const { data, error } = await authClient.getSession();
    syncCacheIdentity(
      queryClient,
      cacheIdentityRef,
      data?.user?.id ?? null,
      error,
    );
    // The profile shows at once, as it did before the session effect catches up.
    if (!error) setSessionAccount(data?.user?.id ?? null);
    await reloadProfile();
  }, [queryClient, reloadProfile]);

  const { updatePinnedStores, updatePinnedPlaces, mergeUser } =
    useProfileUpdaters();

  const account = deriveAccountState({
    session,
    sessionPending,
    sessionError,
    sessionAccount,
    cacheIdentity,
    accountId,
    profile: profileQuery.data,
    // Stays failed through a refetch, until one succeeds.
    hasProfileFailed: profileQuery.isError,
    profileFetchStatus: profileQuery.fetchStatus,
  });

  const value: IUserContext = {
    ...account,
    // Background refetches of the same account leave it false, so screens do not flash a loading state on focus.
    isLoading: account.isInitializing,
    refreshUser,
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
