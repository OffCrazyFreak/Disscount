import { useMutation } from "@tanstack/react-query";
import { UserDto, UserRequest } from "@/lib/api/types";
import { updateCurrentUser } from "@/lib/api/users/queries";

// The profile itself is not a query: UserProvider owns it and calls
// getCurrentUser directly, so there is no key to invalidate here.
export function useUpdateCurrentUser() {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
}
