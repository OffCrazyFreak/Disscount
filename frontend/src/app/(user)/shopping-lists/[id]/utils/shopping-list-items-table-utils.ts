import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import {
  getChainAvgPriceRange,
  getPriceExtreme,
} from "@/app/products/utils/product-utils";

export interface IChainItemPriceInfo {
  isAvailable: boolean;
  price: number;
  quantity: number;
  total: number;
  isLowestPrice: boolean;
  isHighestPrice: boolean;
}

export function getChainItemPriceInfo(
  item: ShoppingListItemDto,
  productsData: ProductResponse[],
  chain: ChainProductResponse,
): IChainItemPriceInfo {
  const product = productsData.find((p) => p?.ean === item.ean);

  const chainData = product?.chains?.find(
    (candidate) => candidate.chain === chain.chain,
  );

  const isAvailable = Boolean(chainData);

  const price = chainData ? parseFloat(chainData.avg_price) : 0;
  const quantity = item.amount || 1;
  const total = price * quantity;

  const range = getChainAvgPriceRange(product);

  // getPriceExtreme returns null when min === max, so uniform prices stay unflagged.
  const priceExtreme =
    isAvailable && range ? getPriceExtreme(price, range.min, range.max) : null;

  return {
    isAvailable,
    price,
    quantity,
    total,
    isLowestPrice: priceExtreme === "min",
    isHighestPrice: priceExtreme === "max",
  };
}
