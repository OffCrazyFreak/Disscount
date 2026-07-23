import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ProductResponse,
  ChainProductResponse,
} from "@/lib/cijene-api/schemas";
import { getPriceExtreme } from "@/app/products/utils/product-utils";

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
    (c: { chain: string; avg_price: string }) => c.chain === chain.chain,
  );

  const isAvailable = Boolean(chainData);

  const price = chainData ? parseFloat(chainData.avg_price) : 0;
  const quantity = item.amount || 1;
  const total = price * quantity;

  const allChainPrices =
    product?.chains
      ?.map((c: { chain: string; avg_price: string }) =>
        parseFloat(c.avg_price),
      )
      .filter((p) => !isNaN(p)) || [];
  const minPriceAcrossChains =
    allChainPrices.length > 0 ? Math.min(...allChainPrices) : 0;
  const maxPriceAcrossChains =
    allChainPrices.length > 0 ? Math.max(...allChainPrices) : 0;

  // getPriceExtreme returns null when min === max, so uniform prices stay unflagged.
  const priceExtreme = isAvailable
    ? getPriceExtreme(price, minPriceAcrossChains, maxPriceAcrossChains)
    : null;

  return {
    isAvailable,
    price,
    quantity,
    total,
    isLowestPrice: priceExtreme === "min",
    isHighestPrice: priceExtreme === "max",
  };
}
