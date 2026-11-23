import {
  useRemoveAvatar,
  useUpdateCurrentUser,
  useUploadAvatar,
} from "@/lib/api/users/hooks";
import { getCurrentUser, uploadAvatar } from "@/lib/api/users/queries";

const userService = {
  getCurrentUser,
  uploadAvatar,
  useUpdateCurrentUser,
  useUploadAvatar,
  useRemoveAvatar,
};

export default userService;
