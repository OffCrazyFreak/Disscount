import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import {
  getPriceExtreme,
  PriceExtreme,
} from "@/app/products/utils/product-utils";
import { ChainSummary } from "@/app/(user)/shopping-lists/[id]/typings/store-chain-types";

interface IStoreCardMetricsParams {
  chain: ChainSummary;
  shoppingList: ShoppingListDto;
  absoluteMinPrice: number;
  absoluteMaxPrice: number;
  pinnedStores: PinnedStoreDto[] | null | undefined;
}

export interface IStoreCardMetrics {
  isPreferred: boolean;
  isDataFromToday: boolean;
  storeMinPrice: number;
  storeAvgPrice: number;
  storeMaxPrice: number;
  totalItemsInList: number;
  hasAllItems: boolean;
  minExtreme: PriceExtreme;
  avgExtreme: PriceExtreme;
  maxExtreme: PriceExtreme;
}

export function getStoreCardMetrics({
  chain,
  shoppingList,
  absoluteMinPrice,
  absoluteMaxPrice,
  pinnedStores,
}: IStoreCardMetricsParams): IStoreCardMetrics {
  const isPreferred =
    pinnedStores?.some((s) => s.storeApiId === chain.chain) || false;

  const today = new Date().toISOString().split("T")[0];
  const isDataFromToday = chain.price_date === today;

  const storeMinPrice = parseFloat(chain.min_price);
  const storeAvgPrice = parseFloat(chain.avg_price);
  const storeMaxPrice = parseFloat(chain.max_price);

  // Store metrics are computed over not-yet-bought items, so compare coverage
  // against the count of items still to buy (checked-off items are excluded).
  const totalItemsInList =
    shoppingList.items?.filter((item) => !item.isChecked).length || 0;
  const hasAllItems = chain.itemCount === totalItemsInList;

  // Only color the totals when this store covers every item, so the comparison
  // against the absolute min/max range is meaningful.
  const minExtreme = hasAllItems
    ? getPriceExtreme(storeMinPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;
  const avgExtreme = hasAllItems
    ? getPriceExtreme(storeAvgPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;
  const maxExtreme = hasAllItems
    ? getPriceExtreme(storeMaxPrice, absoluteMinPrice, absoluteMaxPrice)
    : null;

  return {
    isPreferred,
    isDataFromToday,
    storeMinPrice,
    storeAvgPrice,
    storeMaxPrice,
    totalItemsInList,
    hasAllItems,
    minExtreme,
    avgExtreme,
    maxExtreme,
  };
}
