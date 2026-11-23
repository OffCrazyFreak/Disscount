import {
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,
} from "@/lib/api/watchlist/hooks";
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/api/watchlist/queries";

export { addToWatchlist, removeFromWatchlist };

const watchlistService = {
  removeFromWatchlist,
  useAddToWatchlist,
  useGetCurrentUserWatchlist,
  useGetWatchlistItemsByProductApiId,
  useRemoveFromWatchlist,
};

export default watchlistService;
