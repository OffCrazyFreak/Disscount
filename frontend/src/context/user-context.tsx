"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { userService, preferencesService } from "@/lib/api";
import { authClient, useSession } from "@/lib/auth-client";
import { clearAuthToken, resetAuthToken } from "@/lib/api/api-base";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";

// Define the shape of our context
interface IUserContext {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<UserDto | undefined>;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
  updatePinnedStores: (stores: PinnedStoreDto[]) => void;
  updatePinnedPlaces: (places: PinnedPlaceDto[]) => void;
  handleUserLogin: () => Promise<void>;
}

// Create the context with a default value
const UserContext = createContext<IUserContext | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Identity (id/name/email/image) comes from better-auth.
  const { data: session, isPending: isSessionLoading } = useSession();
  // Business profile (subscription, notifications, pinned stores/places, ...)
  // comes from the Spring backend.
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Fetch the current user's business profile and merge in their preferences.
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await userService.getCurrentUser();

      // If the profile doesn't include preferences, fetch them in parallel.
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
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle logout — clear the better-auth session and all local user state.
  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearAuthToken();
      setUser(null);
      // Invalidate all React Query caches related to user data
      queryClient.clear();
    }
  }, [queryClient]);

  // Update pinned stores
  const updatePinnedStores = useCallback((stores: PinnedStoreDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedStores: stores } : null));
  }, []);

  // Update pinned places
  const updatePinnedPlaces = useCallback((places: PinnedPlaceDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedPlaces: places } : null));
  }, []);

  // Called by the login/signup forms after a successful better-auth sign-in.
  const handleUserLogin = useCallback(async () => {
    // A prior sign-out may have engaged the token backoff — clear it so the
    // profile fetch can grab a fresh JWT immediately.
    resetAuthToken();
    await refreshUser();
  }, [refreshUser]);

  // Load (or clear) the profile whenever the better-auth session changes.
  useEffect(() => {
    if (isSessionLoading) return;

    if (session?.user) {
      void refreshUser();
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [isSessionLoading, session?.user?.id, refreshUser]);

  // Merge the display identity (name/image) from the session into the profile
  // so existing consumers can read everything off a single `user` object.
  const mergedUser: UserDto | null = user
    ? {
        ...user,
        name: session?.user?.name ?? user.name ?? null,
        image: session?.user?.image ?? user.image ?? null,
      }
    : null;

  const value: IUserContext = {
    user: mergedUser,
    isLoading: isLoading || isSessionLoading,
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

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
