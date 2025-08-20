import apiClient from "@/lib/old/api-base";
import { UserDto, UserRequest } from "@/lib/old/api-types";

export const userApi = {
  // Get current user
  getCurrentUser: async (): Promise<UserDto> => {
    const response = await apiClient.get("/api/users/me");
    return response.data;
  },

  // Update user profile
  updateUserProfile: async (userData: UserRequest): Promise<UserDto> => {
    const response = await apiClient.patch("/api/users/me", userData);
    return response.data;
  },

  // Delete current user
  deleteCurrentUser: async (): Promise<{ [key: string]: string }> => {
    const response = await apiClient.delete("/api/users/me");
    return response.data;
  },
};
