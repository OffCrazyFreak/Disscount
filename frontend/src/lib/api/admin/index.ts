import * as queries from "@/lib/api/admin/queries";
import * as hooks from "@/lib/api/admin/hooks";
import { ADMIN_QUERY_KEYS } from "@/lib/api/admin/keys";

export * from "@/lib/api/admin/queries";
export * from "@/lib/api/admin/hooks";
export { ADMIN_QUERY_KEYS };

const adminService = {
  ...queries,
  ...hooks,
  QUERY_KEYS: ADMIN_QUERY_KEYS,
};

export default adminService;
