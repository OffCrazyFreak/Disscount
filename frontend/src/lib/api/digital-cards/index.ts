import * as queries from "@/lib/api/digital-cards/queries";
import * as hooks from "@/lib/api/digital-cards/hooks";

export * from "@/lib/api/digital-cards/queries";
export * from "@/lib/api/digital-cards/hooks";

const digitalCardService = { ...queries, ...hooks };

export default digitalCardService;
