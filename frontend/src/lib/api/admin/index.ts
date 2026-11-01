import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import { UserDto, AccountType } from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin";

const ADMIN_QUERY_KEYS = {
  users: ["admin", "users"] as const,
};

const UPDATE_ACCOUNT_TYPE_MUTATION_KEY = ["admin", "updateAccountType"];

async function getAllUsers(): Promise<UserDto[]> {
  const response = await apiClient.get<UserDto[]>(`${ADMIN_BASE_PATH}/users`);
  return response.data;
}

async function updateUserAccountType(
  userId: string,
  accountType: AccountType,
): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(
    `${ADMIN_BASE_PATH}/users/${userId}`,
    { accountType },
  );
  return response.data;
}

async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE_PATH}/users/${userId}`);
}

function useGetAllUsers({ enabled = true } = {}) {
  return useQuery<UserDto[], Error>({
    queryKey: ADMIN_QUERY_KEYS.users,
    queryFn: getAllUsers,
    enabled,
  });
}

function useUpdateUserAccountType() {
  const queryClient = useQueryClient();

  function setAccountType(userId: string, accountType: AccountType) {
    queryClient.setQueryData<UserDto[]>(ADMIN_QUERY_KEYS.users, (users) =>
      users?.map((user) =>
        user.id === userId ? { ...user, accountType } : user,
      ),
    );
  }

  return useMutation<
    UserDto,
    Error,
    { userId: string; accountType: AccountType },
    AccountType | undefined
  >({
    mutationKey: UPDATE_ACCOUNT_TYPE_MUTATION_KEY,
    mutationFn: ({ userId, accountType }) =>
      updateUserAccountType(userId, accountType),
    // The select is controlled by this cache entry, so without the write it shows the old type until the refetch lands.
    onMutate: async ({ userId, accountType }) => {
      await queryClient.cancelQueries({ queryKey: ADMIN_QUERY_KEYS.users });

      const previous = queryClient
        .getQueryData<UserDto[]>(ADMIN_QUERY_KEYS.users)
        ?.find((user) => user.id === userId)?.accountType;
      setAccountType(userId, accountType);

      return previous;
    },
    // Restores only this user, so a rollback cannot undo another row's accepted change.
    onError: (_error, { userId }, previous) => {
      if (previous) setAccountType(userId, previous);
    },
    // A refetch while another row is still saving would show that row's old type again.
    onSettled: () =>
      queryClient.isMutating({
        mutationKey: UPDATE_ACCOUNT_TYPE_MUTATION_KEY,
      }) === 1
        ? queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users })
        : undefined,
  });
}

function useDeleteUser() {
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
