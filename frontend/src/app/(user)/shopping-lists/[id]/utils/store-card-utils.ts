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

  // Coverage compares against items still to buy, not the whole list.
  const totalItemsInList =
    shoppingList.items?.filter((item) => !item.isChecked).length || 0;
  const hasAllItems = chain.itemCount === totalItemsInList;

  // Coloring only means something when the store covers every item.
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
