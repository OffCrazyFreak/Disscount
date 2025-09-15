import { useMutation } from "@tanstack/react-query";
import apiClient from "../api-base";
import { AuthResponse, LoginRequest, RegisterRequest } from "../types";
import { setAccessToken, removeAccessToken } from "../local-storage";

const AUTH_BASE_PATH = "/api/auth";

/**
 * Login user with username/email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/login`,
    data
  );

  // Store the access token in localStorage
  if (response.data.accessToken) {
    setAccessToken(response.data.accessToken);
  }

  return response.data;
}

/**
 * Register a new user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/register`,
    data
  );

  // Store the access token in localStorage
  if (response.data.accessToken) {
    setAccessToken(response.data.accessToken);
  }

  return response.data;
}

/**
 * Refresh the access token using the refresh token in cookies
 */
export async function refreshToken(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    `${AUTH_BASE_PATH}/refresh`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Store the new access token
  if (response.data.accessToken) {
    setAccessToken(response.data.accessToken);
  }

  return response.data;
}

/**
 * Logout from current session
 */
export async function logout(): Promise<void> {
  await apiClient.post(
    `${AUTH_BASE_PATH}/logout`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Remove the access token from storage
  removeAccessToken();
}

/**
 * Logout from all sessions
 */
export async function logoutAll(): Promise<void> {
  await apiClient.post(
    `${AUTH_BASE_PATH}/logout-all`,
    {},
    {
      withCredentials: true, // Required to include cookies
    }
  );

  // Remove the access token from storage
  removeAccessToken();
}

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

const authService = {
  login,
  register,
  refreshToken,
  logout,
  logoutAll,
  // React Query hooks
  useLogin,
  useRegister,
  useLogout,
  useLogoutAll,
  useRefreshToken,
};

export default authService;
