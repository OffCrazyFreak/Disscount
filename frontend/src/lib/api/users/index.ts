import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../api-base";
import { UserDto, UserRequest } from "../types";

const USERS_BASE_PATH = "/api/users";

/**
 * Get the current authenticated user's business profile.
 * The backend lazily provisions the profile row on first call.
 */
export async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<UserDto>(`${USERS_BASE_PATH}/me`);
  return response.data;
}

/**
 * Update the current user's profile
 */
export async function updateCurrentUser(data: UserRequest): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(`${USERS_BASE_PATH}/me`, data);
  return response.data;
}

/**
 * Delete (soft delete) the current user's account
 */
export async function deleteCurrentUser(): Promise<void> {
  await apiClient.delete(`${USERS_BASE_PATH}/me`);
}

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

const userService = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  // React Query hooks
  useGetCurrentUser,
  useUpdateCurrentUser,
  useDeleteCurrentUser,
};

export default userService;
