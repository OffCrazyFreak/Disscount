"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { authClient, useSession } from "@/lib/auth/client";
import { clearAuthToken, resetAuthToken } from "@/lib/api/api-base";
import { purgeOfflineCache } from "@/lib/offline/purge";
import { userService, preferencesService } from "@/lib/api";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { isProtectedRoute } from "@/constants/protected-routes";

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

  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = useSession();

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await userService.getCurrentUser();

      if (userData && (!userData.pinnedStores || !userData.pinnedPlaces)) {
        try {
          const [stores, places] = await Promise.all([
            preferencesService.getPinnedStores(),
            preferencesService.getPinnedPlaces(),
          ]);
          userData.pinnedStores = stores;
          userData.pinnedPlaces = places;
        } catch (prefError) {
          console.error("Failed to fetch preferences:", prefError);
        }
      }

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

    // The directive covers this whole effect, not just the line under it: the else
    // branch clears user state synchronously too. Both sides react to an auth result
    // that only exists after the session resolves, so neither is derivable.
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshUser();
    } else {
      // Wipe the cache so a previous user never lingers on a shared device.
      clearAuthToken();
      void purgeOfflineCache(queryClient);
      setUser(null);
      setIsLoading(false);
      setHasResolvedAuth(true);
    }
    // Keyed on the user id, not the user object the lint asks for: better-auth hands
    // back a new session object on every poll, so depending on it would refetch the
    // profile and re-purge the offline cache on a cadence rather than on a real
    // sign-in or sign-out.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, sessionPending, refreshUser, queryClient]);

  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearAuthToken();
      setUser(null);
      await purgeOfflineCache(queryClient);
      // Staying on a protected route signed out would just show a login gate.
      if (isProtectedRoute(pathname)) router.push("/");
    }
  }, [queryClient, router, pathname]);

  // Called by login/signup forms after signIn/signUp succeeds to eagerly load the profile
  const handleUserLogin = useCallback(async () => {
    resetAuthToken();
    await refreshUser();
  }, [refreshUser]);

  const updatePinnedStores = useCallback((stores: PinnedStoreDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedStores: stores } : null));
  }, []);

  const updatePinnedPlaces = useCallback((places: PinnedPlaceDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedPlaces: places } : null));
  }, []);

  const mergeUser = useCallback((patch: Partial<UserDto>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  // Prefer the session's name and email at render, keeping the app profile's other fields.
  const mergedUser: UserDto | null = user
    ? {
        ...user,
        name: session?.user?.name ?? user.name ?? null,
        email: session?.user?.email ?? user.email ?? null,
        image: user.image ?? null,
      }
    : null;

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
