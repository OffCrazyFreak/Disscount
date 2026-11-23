import apiClient from "@/lib/api/api-base";
import {
  UserDto,
  UserRequest,
  userDtoSchema,
  userRequestSchema,
} from "@/lib/api/types";

const USERS_BASE_PATH = "/api/users";

export async function getCurrentUser(signal?: AbortSignal): Promise<UserDto> {
  const response = await apiClient.get<unknown>(`${USERS_BASE_PATH}/me`, {
    signal,
  });
  return userDtoSchema.parse(response.data);
}

export async function updateCurrentUser(data: UserRequest): Promise<UserDto> {
  const validatedData = userRequestSchema.parse(data);

  const response = await apiClient.patch<UserDto>(
    `${USERS_BASE_PATH}/me`,
    validatedData,
  );
  return response.data;
}

export async function uploadAvatar(avatar: Blob): Promise<UserDto> {
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

export async function removeAvatar(): Promise<UserDto> {
  const response = await apiClient.delete<unknown>(
    `${USERS_BASE_PATH}/me/avatar`,
  );
  return userDtoSchema.parse(response.data);
}
