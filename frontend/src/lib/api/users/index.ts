import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import { UserDto, UserRequest } from "@/lib/api/types";

const USERS_BASE_PATH = "/api/users";

export async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<UserDto>(`${USERS_BASE_PATH}/me`);
  return response.data;
}

export async function updateCurrentUser(data: UserRequest): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(`${USERS_BASE_PATH}/me`, data);
  return response.data;
}

export async function deleteCurrentUser(): Promise<void> {
  await apiClient.delete(`${USERS_BASE_PATH}/me`);
}

export function useUpdateCurrentUser() {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
}

const userService = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  useUpdateCurrentUser,
};

export default userService;
