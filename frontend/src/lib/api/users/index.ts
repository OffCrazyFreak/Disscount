import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import {
  UserDto,
  UserRequest,
  userDtoSchema,
  userRequestSchema,
} from "@/lib/api/types";

const USERS_BASE_PATH = "/api/users";

async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<unknown>(`${USERS_BASE_PATH}/me`);
  return userDtoSchema.parse(response.data);
}

async function updateCurrentUser(data: UserRequest): Promise<UserDto> {
  const validatedData = userRequestSchema.parse(data);

  const response = await apiClient.patch<UserDto>(
    `${USERS_BASE_PATH}/me`,
    validatedData,
  );
  return response.data;
}

async function uploadAvatar(avatar: Blob): Promise<UserDto> {
  const body = new FormData();
  body.append(
    "file",
    avatar,
    avatar.type === "image/jpeg" ? "avatar.jpg" : "avatar.webp",
  );

  const response = await apiClient.put<unknown>(
    `${USERS_BASE_PATH}/me/avatar`,
    body,
    // Unset so the browser writes the multipart boundary itself.
    { headers: { "Content-Type": undefined } },
  );
  return userDtoSchema.parse(response.data);
}

async function removeAvatar(): Promise<UserDto> {
  const response = await apiClient.delete<unknown>(
    `${USERS_BASE_PATH}/me/avatar`,
  );
  return userDtoSchema.parse(response.data);
}

function useUpdateCurrentUser() {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
}

function useUploadAvatar() {
  return useMutation<UserDto, Error, Blob>({ mutationFn: uploadAvatar });
}

function useRemoveAvatar() {
  return useMutation<UserDto, Error, void>({ mutationFn: removeAvatar });
}

const userService = {
  getCurrentUser,
  uploadAvatar,
  useUpdateCurrentUser,
  useUploadAvatar,
  useRemoveAvatar,
};

export default userService;
