import { ShoppingListDto } from "@/lib/api/types";
import { PinnedStoreDto } from "@/lib/api/schemas/preferences";
import {
  getPriceExtreme,
  PriceExtreme,
} from "@/app/[locale]/products/utils/product-utils";
import { ChainSummary } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/store-chain-types";
import { itemsToCompare } from "@/app/[locale]/(user)/shopping-lists/utils/catalog-items";
import { isPriceDateToday } from "@/utils/product-price-utils";

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

  const isDataFromToday = isPriceDateToday(chain.price_date);

  const storeMinPrice = parseFloat(chain.min_price);
  const storeAvgPrice = parseFloat(chain.avg_price);
  const storeMaxPrice = parseFloat(chain.max_price);

  const totalItemsInList = itemsToCompare(shoppingList.items).length;
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
