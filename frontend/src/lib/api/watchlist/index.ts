import * as queries from "@/lib/api/watchlist/queries";
import * as hooks from "@/lib/api/watchlist/hooks";
import { WATCHLIST_QUERY_KEYS } from "@/lib/api/watchlist/keys";

export * from "@/lib/api/watchlist/queries";
export * from "@/lib/api/watchlist/hooks";
export { WATCHLIST_QUERY_KEYS };

const watchlistService = {
  ...queries,
  ...hooks,
  QUERY_KEYS: WATCHLIST_QUERY_KEYS,
};

export default watchlistService;
