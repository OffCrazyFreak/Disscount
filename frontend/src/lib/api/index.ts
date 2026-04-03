import apiClient from "./api-base";
import authService from "./auth";
import userService from "./users";
import preferencesService from "./preferences";
import shoppingListService from "./shopping-lists";
import digitalCardService from "./digital-cards";
import watchlistService from "./watchlist";

// Re-export types
export { WatchType } from "./schemas/watchlist";

export {
  apiClient,
  authService,
  userService,
  preferencesService,
  shoppingListService,
  digitalCardService,
  watchlistService,
};
