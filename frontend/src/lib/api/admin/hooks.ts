import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ADMIN_QUERY_KEYS } from "@/lib/api/admin/keys";
import {
  deleteUser,
  getAllUsers,
  updateUserAccountType,
} from "@/lib/api/admin/queries";
import { UserDto, AccountType } from "@/lib/api/types";

const UPDATE_ACCOUNT_TYPE_MUTATION_KEY = ["admin", "updateAccountType"];

function allUsersQueryOptions() {
  return queryOptions({
    queryKey: ADMIN_QUERY_KEYS.users,
    queryFn: getAllUsers,
  });
}

export function useGetAllUsers({ enabled = true } = {}) {
  return useQuery({ ...allUsersQueryOptions(), enabled });
}

export function useUpdateUserAccountType() {
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

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.users });
    },
  });
}
