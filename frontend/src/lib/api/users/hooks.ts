import { useMutation } from "@tanstack/react-query";
import {
  removeAvatar,
  updateCurrentUser,
  uploadAvatar,
} from "@/lib/api/users/queries";
import { UserDto, UserRequest } from "@/lib/api/types";

export function useUpdateCurrentUser() {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
}

export function useUploadAvatar() {
  return useMutation<UserDto, Error, Blob>({ mutationFn: uploadAvatar });
}

export function useRemoveAvatar() {
  return useMutation<UserDto, Error, void>({ mutationFn: removeAvatar });
}
