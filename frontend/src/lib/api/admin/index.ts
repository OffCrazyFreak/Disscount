import {
  useDeleteUser,
  useGetAllUsers,
  useUpdateUserAccountType,
} from "@/lib/api/admin/hooks";

const adminService = {
  useGetAllUsers,
  useUpdateUserAccountType,
  useDeleteUser,
};

export default adminService;
