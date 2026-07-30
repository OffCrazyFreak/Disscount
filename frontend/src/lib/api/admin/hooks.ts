import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { UserDto, AccountType } from "@/lib/api/types";
import { ADMIN_QUERY_KEYS } from "@/lib/api/admin/keys";
import {
  deleteUser,
  getAllUsers,
  updateUserAccountType,
} from "@/lib/api/admin/queries";

export const adminQueries = {
  users: () =>
    queryOptions({
      queryKey: ADMIN_QUERY_KEYS.users,
      queryFn: getAllUsers,
    }),
};

export function useUpdateUserAccountType() {
  const queryClient = useQueryClient();

  return useMutation<
    UserDto,
    Error,
    { userId: string; accountType: AccountType }
  >({
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
