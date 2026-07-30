import * as queries from "@/lib/api/shopping-lists/queries";
import * as hooks from "@/lib/api/shopping-lists/hooks";

export * from "@/lib/api/shopping-lists/queries";
export * from "@/lib/api/shopping-lists/hooks";
export { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";

const shoppingListService = { ...queries, ...hooks };

export default shoppingListService;
