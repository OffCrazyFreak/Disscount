import {
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,
} from "@/lib/api/watchlist/hooks";
import { removeFromWatchlist } from "@/lib/api/watchlist/queries";

export {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/api/watchlist/queries";

const watchlistService = {
  removeFromWatchlist,
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,
};

export default watchlistService;
