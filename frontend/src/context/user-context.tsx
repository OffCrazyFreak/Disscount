"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authClient, useSession } from "@/lib/auth-client";
import { clearAuthToken, resetAuthToken } from "@/lib/api/api-base";
import { userService, preferencesService } from "@/lib/api";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";

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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();
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
      clearAuthToken();
      setUser(null);
      setIsLoading(false);
    }
  }, [session?.user?.id, sessionPending, refreshUser]);

  const handleLogout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      clearAuthToken();
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

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

  // Merge session identity (name/image from better-auth) into the backend profile at render time.
  // Keeps refreshUser free of session dependency while still exposing a single unified user object.
  const mergedUser: UserDto | null = user
    ? {
        ...user,
        name: session?.user?.name ?? user.name ?? null,
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
