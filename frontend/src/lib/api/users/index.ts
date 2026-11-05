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

function useUpdateCurrentUser() {
  return useMutation<UserDto, Error, UserRequest>({
    mutationFn: updateCurrentUser,
  });
}

const userService = {
  getCurrentUser,
  useUpdateCurrentUser,
};

export default userService;
