import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../api-base";
import { AuthResponse, LoginRequest, RegisterRequest } from "../types";

const AUTH_BASE_PATH = "/api/auth";

/**
 * Login user with username/email and password
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/login`,
    data
  );

  // Store the access token in localStorage
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  return response.data;
};

/**
 * Register a new user
 */
export const register = async (
  data: RegisterRequest
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/register`,
    data
  );

  // Store the access token in localStorage
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  return response.data;
};

/**
 * Refresh the access token using the refresh token in cookies
 */
export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/refresh`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Store the new access token
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
  }

  return response.data;
};

/**
 * Logout from current session
 */
export const logout = async (): Promise<void> => {
  await apiClient.post(
    `${AUTH_BASE_PATH}/logout`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Remove the access token from localStorage
  localStorage.removeItem("accessToken");
};

/**
 * Logout from all sessions
 */
export const logoutAll = async (): Promise<void> => {
  await apiClient.post(
    `${AUTH_BASE_PATH}/logout-all`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Remove the access token from localStorage
  localStorage.removeItem("accessToken");
};

// React Query hooks
export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: login,
  });
};

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: register,
  });
};

export const useLogout = () => {
  return useMutation<void, Error>({
    mutationFn: logout,
  });
};

export const useLogoutAll = () => {
  return useMutation<void, Error>({
    mutationFn: logoutAll,
  });
};

export const useRefreshToken = () => {
  return useMutation<AuthResponse, Error>({
    mutationFn: refreshToken,
  });
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return typeof window !== "undefined" && !!localStorage.getItem("accessToken");
};

const authService = {
  login,
  register,
  refreshToken,
  logout,
  logoutAll,
  isAuthenticated,
  // React Query hooks
  useLogin,
  useRegister,
  useLogout,
  useLogoutAll,
  useRefreshToken,
};

export default authService;
