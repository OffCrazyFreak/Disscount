"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authClient, useSession } from "@/lib/auth/client";
import { clearAuthToken, resetAuthToken } from "@/lib/api/api-base";
import { purgeOfflineCache } from "@/lib/offline/purge";
import { getCacheIdentity } from "@/lib/offline/cache-identity";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { isProtectedRoute } from "@/constants/protected-routes";
import { loadUserProfile } from "@/context/load-user-profile";
import { mergeSessionUser } from "@/context/merge-session-user";
import {
  persistedCacheIdentity,
  syncCacheIdentity,
} from "@/context/sync-cache-identity";
import { useUserUpdaters } from "@/context/use-user-updaters";

interface IUserContext {
  user: UserDto | null;
  isLoading: boolean;
  /** True only until auth first resolves; stays false through later refreshes */
  isInitializing: boolean;
  isAuthenticated: boolean;
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
  const router = useRouter();
  const pathname = usePathname();
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
    } finally {
      setIsLoading(false);
      setHasResolvedAuth(true);
    }
  }, []);

  useEffect(() => {
    if (sessionPending) return;

    const identity = session?.user?.id ?? null;

    syncCacheIdentity(queryClient, cacheIdentityRef, identity, sessionError);

    // The directive covers this whole effect, not just the line under it: the else
    // branch clears user state synchronously too. Both sides react to an auth result
    // that only exists after the session resolves, so neither is derivable.
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshUser();
    } else {
      clearAuthToken();
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

  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearAuthToken();
      setUser(null);
      // Awaited here, and the identity has not moved yet, so the current one is the
      // account being signed out.
      await purgeOfflineCache(queryClient, getCacheIdentity());
      // Staying on a protected route signed out would just show a login gate.
      if (isProtectedRoute(pathname)) router.push("/");
    }
  }, [queryClient, router, pathname]);

  // Called by login/signup forms after signIn/signUp succeeds to eagerly load the profile
  const handleUserLogin = useCallback(async () => {
    resetAuthToken();
    await refreshUser();
  }, [refreshUser]);

  const { updatePinnedStores, updatePinnedPlaces, mergeUser } =
    useUserUpdaters(setUser);

  const mergedUser = mergeSessionUser(user, session?.user);

  const value: IUserContext = {
    user: mergedUser,
    isLoading: isLoading || sessionPending,
    isInitializing: !hasResolvedAuth,
    isAuthenticated: !!mergedUser,
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
