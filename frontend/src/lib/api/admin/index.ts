import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../api-base";
import { UserDto, AccountType } from "../types";

const ADMIN_BASE_PATH = "/api/admin";

const ADMIN_QUERY_KEYS = {
  users: ["admin", "users"] as const,
};

export async function getAllUsers(): Promise<UserDto[]> {
  const response = await apiClient.get<UserDto[]>(`${ADMIN_BASE_PATH}/users`);
  return response.data;
}

export async function updateUserAccountType(
  userId: string,
  accountType: AccountType
): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(
    `${ADMIN_BASE_PATH}/users/${userId}`,
    { accountType }
  );
  return response.data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE_PATH}/users/${userId}`);
}

export function useGetAllUsers({ enabled = true } = {}) {
  return useQuery<UserDto[], Error>({
    queryKey: ADMIN_QUERY_KEYS.users,
    queryFn: getAllUsers,
    enabled,
  });
}

export function useUpdateUserAccountType() {
  const queryClient = useQueryClient();

  return useMutation<UserDto, Error, { userId: string; accountType: AccountType }>({
    mutationFn: ({ userId, accountType }) =>
      updateUserAccountType(userId, accountType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
    },
  });
}

const adminService = {
  getAllUsers,
  updateUserAccountType,
  deleteUser,
  useGetAllUsers,
  useUpdateUserAccountType,
  useDeleteUser,
};

export default adminService;
