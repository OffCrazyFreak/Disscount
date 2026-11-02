import * as queries from "@/lib/api/digital-cards/queries";
import * as hooks from "@/lib/api/digital-cards/hooks";
import * as mutationHooks from "@/lib/api/digital-cards/mutation-hooks";

export * from "@/lib/api/digital-cards/queries";
export * from "@/lib/api/digital-cards/hooks";
export * from "@/lib/api/digital-cards/mutation-hooks";

const digitalCardService = { ...queries, ...hooks, ...mutationHooks };

export default digitalCardService;
