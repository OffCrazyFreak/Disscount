import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../api-base";
import { UserDto, UserRequest } from "../types";

const USERS_BASE_PATH = "/api/users";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<UserDto>(`${USERS_BASE_PATH}/me`);
  return response.data;
};

/**
 * Update the current user's profile
 */
export async function updateCurrentUser(
  data: UserRequest
): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(
    `${USERS_BASE_PATH}/me`,
    data
  );
  return response.data;
};

/**
 * Delete (soft delete) the current user's account
 */
export async function deleteCurrentUser(): Promise<void> {
  await apiClient.delete(`${USERS_BASE_PATH}/me`);
};

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserDto[]> {
  const response = await apiClient.get<UserDto[]>(USERS_BASE_PATH);
  return response.data;
};

/**
 * Check if username exists
 */
export async function checkUsernameExists(
  username: string
): Promise<boolean> {
  const response = await apiClient.get<Record<string, boolean>>(
    `${USERS_BASE_PATH}/exists/username/${username}`
  );
  // Get first value from the response object
  const values = Object.keys(response.data).map((key) => response.data[key]);
  return values.length > 0 ? values[0] : false;
};

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const response = await apiClient.get<Record<string, boolean>>(
    `${USERS_BASE_PATH}/exists/email/${email}`
  );
  // Get first value from the response object
  const values = Object.keys(response.data).map((key) => response.data[key]);
  return values.length > 0 ? values[0] : false;
};

// React Query hooks
export const useGetCurrentUser = () => {
  return useQuery<UserDto, Error>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
};

export const useUpdateCurrentUser = () => {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
};

export const useDeleteCurrentUser = () => {
  return useMutation<void, Error>({
    mutationFn: deleteCurrentUser,
  });
};

export const useCheckUsernameExists = (username: string) => {
  return useQuery<boolean, Error>({
    queryKey: ["usernameExists", username],
    queryFn: () => checkUsernameExists(username),
    enabled: !!username && username.length >= 2, // Only run if username is provided and valid
  });
};

export const useCheckEmailExists = (email: string) => {
  return useQuery<boolean, Error>({
    queryKey: ["emailExists", email],
    queryFn: () => checkEmailExists(email),
    enabled: !!email && email.includes("@"), // Only run if email is provided and valid
  });
};

const userService = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  getAllUsers,
  checkUsernameExists,
  checkEmailExists,
  // React Query hooks
  useGetCurrentUser,
  useUpdateCurrentUser,
  useDeleteCurrentUser,
  useCheckUsernameExists,
  useCheckEmailExists,
};

export default userService;
