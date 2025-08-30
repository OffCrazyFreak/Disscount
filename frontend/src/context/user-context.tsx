"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  authService,
  userService,
  preferencesService,
  shoppingListService,
  digitalCardService,
} from "@/lib/api";
import { getAccessToken } from "@/lib/api/local-storage";
import {
  UserDto,
  PinnedStoreDto,
  PinnedPlaceDto,
  ShoppingListDto,
  DigitalCardDto,
} from "@/lib/api/types";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// Define the shape of our context
interface UserContextType {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<UserDto | undefined>;
  refreshShoppingLists: () => Promise<void>;
  refreshDigitalCards: () => Promise<void>;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
  updatePinnedStores: (stores: PinnedStoreDto[]) => void;
  updatePinnedPlaces: (places: PinnedPlaceDto[]) => void;
  shoppingLists: ShoppingListDto[];
  digitalCards: DigitalCardDto[];
  updateShoppingLists: (lists: ShoppingListDto[]) => void;
  updateDigitalCards: (cards: DigitalCardDto[]) => void;
  handleUserLogin: (user: UserDto) => Promise<void>;
}

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shoppingLists, setShoppingLists] = useState<ShoppingListDto[]>([]);
  const [digitalCards, setDigitalCards] = useState<DigitalCardDto[]>([]);
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
      // Fetch user's shopping lists and digital cards in parallel
      try {
        const [lists, cards] = await Promise.all([
          shoppingListService.getCurrentUserShoppingLists(),
          digitalCardService.getUserDigitalCards(),
        ]);
        setShoppingLists(lists || []);
        setDigitalCards(cards || []);
      } catch (listCardErr) {
        console.error(
          "Failed to fetch shopping lists or digital cards:",
          listCardErr
        );
        // keep empty arrays if fetching fails
        setShoppingLists([]);
        setDigitalCards([]);
      }
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
        // Clear cached lists/cards on logout
        setShoppingLists([]);
        setDigitalCards([]);
        // Invalidate all React Query caches related to user data
        queryClient.clear();
      },
    });
  }, [logoutMutation, queryClient]);

  // Handle user login - fetch shopping lists and digital cards after login
  const handleUserLogin = useCallback(
    async (userData: UserDto) => {
      setUser(userData);

      // Fetch user's shopping lists and digital cards in parallel
      try {
        const [lists, cards] = await Promise.all([
          shoppingListService.getCurrentUserShoppingLists(),
          digitalCardService.getUserDigitalCards(),
        ]);
        setShoppingLists(lists || []);
        setDigitalCards(cards || []);
        // Invalidate existing cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["shoppingLists", "me"] });
        queryClient.invalidateQueries({ queryKey: ["digitalCards", "me"] });
      } catch (listCardErr) {
        console.error(
          "Failed to fetch shopping lists or digital cards after login:",
          listCardErr
        );
        // keep empty arrays if fetching fails
        setShoppingLists([]);
        setDigitalCards([]);
      }
    },
    [queryClient]
  );

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

  const updateShoppingLists = useCallback((lists: ShoppingListDto[]) => {
    setShoppingLists(lists);
  }, []);

  const updateDigitalCards = useCallback((cards: DigitalCardDto[]) => {
    setDigitalCards(cards);
  }, []);

  // Refresh shopping lists from API
  const refreshShoppingLists = useCallback(async () => {
    try {
      const lists = await shoppingListService.getCurrentUserShoppingLists();
      setShoppingLists(lists || []);
    } catch (error) {
      console.error("Failed to refresh shopping lists:", error);
    }
  }, []);

  // Refresh digital cards from API
  const refreshDigitalCards = useCallback(async () => {
    try {
      const cards = await digitalCardService.getUserDigitalCards();
      setDigitalCards(cards || []);
    } catch (error) {
      console.error("Failed to refresh digital cards:", error);
    }
  }, []);

  // Check for stored token and fetch user data on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = getAccessToken();

      // If we have a token, fetch user data directly
      if (accessToken) {
        await refreshUser();
        return;
      }

      // If no access token, try to refresh using the refresh token cookie
      // This ensures that users with valid refresh tokens don't appear as
      // unauthenticated during the initial app load
      try {
        const response = await authService.refreshToken();

        // If refresh is successful, the token is automatically stored in the app storage
        // by the refreshToken function, so we can now fetch user data
        if (response.accessToken) {
          await refreshUser();
          return;
        }
      } catch (error) {
        // Refresh failed, which means no valid refresh token exists
        // This is expected for users who haven't logged in or whose refresh tokens have expired
        console.log("No valid refresh token found, user needs to log in");
      }

      // No valid tokens available, user is not authenticated
      setIsLoading(false);
    };

    initializeAuth();
  }, [refreshUser]);

  // The context value that will be provided
  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    refreshUser,
    refreshShoppingLists,
    refreshDigitalCards,
    setUser,
    logout: handleLogout,
    updatePinnedStores,
    updatePinnedPlaces,
    shoppingLists,
    digitalCards,
    updateShoppingLists,
    updateDigitalCards,
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
