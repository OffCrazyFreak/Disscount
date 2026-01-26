"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authService, userService, preferencesService } from "@/lib/api";
import { getAccessToken } from "@/utils/browser/local-storage";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

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
  handleUserLogin: (user: UserDto) => Promise<void>;
}

// Create the context with a default value
const UserContext = createContext<IUserContext | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  // Get the logout mutation
  const logoutMutation = authService.useLogout();

  // Function to refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const userData = await userService.getCurrentUser();

      // If the user data doesn't include preferences, fetch them
      if (userData && (!userData.pinnedStores || !userData.pinnedPlaces)) {
        try {
          // Fetch preferences in parallel
          const [stores, places] = await Promise.all([
            preferencesService.getPinnedStores(),
            preferencesService.getPinnedPlaces(),
          ]);

          // Update the user data with preferences
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

  // Handle logout
  const handleLogout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setUser(null);
        // Invalidate all React Query caches related to user data
        queryClient.clear();
      },
    });
  }, [logoutMutation, queryClient]);

  // Update pinned stores
  const updatePinnedStores = useCallback((stores: PinnedStoreDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedStores: stores } : null));
  }, []);

  // Update pinned places
  const updatePinnedPlaces = useCallback((places: PinnedPlaceDto[]) => {
    setUser((prev) => (prev ? { ...prev, pinnedPlaces: places } : null));
  }, []);

  // Handle user login
  const handleUserLogin = useCallback(async (userData: UserDto) => {
    setUser(userData);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAccessToken();
      if (token) {
        await refreshUser();
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshUser]);

  // The context value that will be provided
  const value: IUserContext = {
    user,
    isLoading,
    isAuthenticated: !!user,
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
