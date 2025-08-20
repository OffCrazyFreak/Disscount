"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authService, userService, preferencesService } from "@/lib/api";
import { UserDto, PinnedStoreDto, PinnedPlaceDto } from "@/lib/api/types";
import { useRouter } from "next/navigation";

// Define the shape of our context
interface UserContextType {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<UserDto | undefined>;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
  updatePinnedStores: (stores: PinnedStoreDto[]) => void;
  updatePinnedPlaces: (places: PinnedPlaceDto[]) => void;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

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
        // Optional: redirect to login page
        router.push("/");
      },
    });
  }, [logoutMutation, router]);

  // Update pinned stores in user context
  const updatePinnedStores = useCallback((stores: PinnedStoreDto[]) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        pinnedStores: stores,
      };
    });
  }, []);

  // Update pinned places in user context
  const updatePinnedPlaces = useCallback((places: PinnedPlaceDto[]) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        pinnedPlaces: places,
      };
    });
  }, []);

  // Check for stored token and fetch user data on mount
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    // If no token, mark as not loading and return
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    // Fetch user data if token exists
    refreshUser();
  }, [refreshUser]);

  // The context value that will be provided
  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    setUser,
    logout: handleLogout,
    updatePinnedStores,
    updatePinnedPlaces,
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
