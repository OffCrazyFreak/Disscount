import * as queries from "@/lib/api/preferences/queries";
import * as hooks from "@/lib/api/preferences/hooks";
import { PREFERENCES_QUERY_KEYS } from "@/lib/api/preferences/keys";

export * from "@/lib/api/preferences/queries";
export * from "@/lib/api/preferences/hooks";
export { PREFERENCES_QUERY_KEYS };

const preferencesService = {
  ...queries,
  ...hooks,
  QUERY_KEYS: PREFERENCES_QUERY_KEYS,
};

export default preferencesService;
