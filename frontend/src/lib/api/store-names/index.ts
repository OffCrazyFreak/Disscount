import * as queries from "@/lib/api/store-names/queries";
import * as hooks from "@/lib/api/store-names/hooks";

export * from "@/lib/api/store-names/queries";
export * from "@/lib/api/store-names/hooks";

const storeNameService = { ...queries, ...hooks };

export default storeNameService;
