"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, AuthResponse } from "./auth-api";

interface User {
  id: string;
  username: string;
  image?: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // On mount attempt to refresh token / initialize user from backend
    const init = async () => {
      setIsLoading(true);

      try {
        const localToken = localStorage.getItem("authToken");

        // Try to detect refresh token in cookies (httpOnly cookie set by backend)
        const refreshToken =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("refreshToken="))
                ?.split("=")[1]
            : undefined;

        if (!localToken && !refreshToken) {
          setIsLoading(false);
          return;
        }

        // Attempt to refresh and get user
        const response = await authService.refreshToken();
        localStorage.setItem("authToken", response.accessToken);
        setUser(response.user);
      } catch (err) {
        // Failed to refresh: clear local token and leave user null
        localStorage.removeItem("authToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authService.login({
        usernameOrEmail,
        password,
      });

      localStorage.setItem("authToken", response.accessToken);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
      const response: AuthResponse = await authService.register({
        username,
        email,
        password,
      });

      localStorage.setItem("authToken", response.accessToken);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
