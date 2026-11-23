import apiClient from "@/lib/api/api-base";
import { UserDto, AccountType, userDtoSchema } from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin";

export async function getAllUsers(): Promise<UserDto[]> {
  const response = await apiClient.get<UserDto[]>(`${ADMIN_BASE_PATH}/users`);
  return response.data.map((item) => userDtoSchema.parse(item));
}

export async function updateUserAccountType(
  userId: string,
  accountType: AccountType,
): Promise<UserDto> {
  const response = await apiClient.patch<UserDto>(
    `${ADMIN_BASE_PATH}/users/${userId}`,
    { accountType },
  );
  return userDtoSchema.parse(response.data);
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`${ADMIN_BASE_PATH}/users/${userId}`);
}
