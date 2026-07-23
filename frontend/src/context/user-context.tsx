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
  isAuthenticated: boolean;
  refreshUser: () => Promise<UserDto | undefined>;
  setUser: (user: UserDto | null) => void;
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
    }
  }, []);

  useEffect(() => {
    if (sessionPending) return;

    if (session?.user) {
      refreshUser();
    } else {
      // No valid session (initial load, explicit logout, expiry, revoked
      // cookie, or sign-out in another tab): wipe the persisted cache so a
      // previous user's data and queued writes never linger on a shared device.
      clearAuthToken();
      void purgeOfflineCache(queryClient);
      setUser(null);
      setIsLoading(false);
    }
  }, [session?.user?.id, sessionPending, refreshUser, queryClient]);

  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearAuthToken();
      setUser(null);
      await purgeOfflineCache(queryClient);
      // Leaving a user-only page (e.g. shopping lists) signed out would show a
      // login gate; send the user home instead.
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

  // Merge session identity (name/email/image from better-auth) into the backend profile at render time.
  // Email is no longer stored in app_user, so it comes from the better-auth session for the current user.
  // Keeps refreshUser free of session dependency while still exposing a single unified user object.
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
    isAuthenticated: !!mergedUser,
    refreshUser,
    setUser,
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
