import { WatchlistItemDto } from "@/lib/api/types";
import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

export interface GroupedWatchlistItems {
  productApiId: string;
  watchlistItems: WatchlistItemDto[];
}

export interface ScopedDiscountedStore {
  chain: ChainProductResponse;
  currentPrice: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface DiscountInfo {
  // Signed value: negative means discounted vs average, positive means above average.
  preferredDifference: number | null;
  // Absolute percentage only (requested UI behavior).
  preferredPercentage: number | null;
  // Kept for notification compatibility (positive only when discounted).
  preferredDiscount: number | null;
  preferredMinPrice: number | null;
  preferredBestChain: ChainProductResponse | null;
  hasPreferredDiscount: boolean;
  totalDifference: number | null;
  totalPercentage: number | null;
  totalDiscount: number | null;
  totalMinPrice: number | null;
  totalBestChain: ChainProductResponse | null;
  avgPrice: number;
}

export interface WatchlistItemWithProduct {
  productApiId: string;
  watchlistItems: WatchlistItemDto[];
  product: ProductResponse | undefined;
  discountInfo: DiscountInfo | null;
  isLoading: boolean;
  error: Error | null;
}
