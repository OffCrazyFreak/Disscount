import * as queries from "@/lib/api/users/queries";
import * as hooks from "@/lib/api/users/hooks";

export * from "@/lib/api/users/queries";
export * from "@/lib/api/users/hooks";

const userService = {
  ...queries,
  ...hooks,
};

export default userService;
