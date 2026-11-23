import { ShoppingListItemDto } from "@/lib/api/types";
import {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import { ChainSummary } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/store-chain-types";
import { parsePrice } from "@/utils/product-price-utils";

interface IChainTotals {
  chain: string;
  totalMin: number;
  totalAvg: number;
  totalMax: number;
  itemCount: number;
  oldestPriceDate: string;
}

/** A chain without an average price does not offer the item; a missing bound falls back to the average. */
function readChainPrices(chain: ChainProductResponse) {
  const avg = parsePrice(chain.avg_price);
  if (avg === null) return null;

  return {
    min: parsePrice(chain.min_price) ?? avg,
    avg,
    max: parsePrice(chain.max_price) ?? avg,
  };
}

export function buildChainAggregates(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): ChainSummary[] {
  const chainMap = new Map<string, IChainTotals>();

  productsData.forEach((product) => {
    const shoppingItem = activeItems.find((item) => item.ean === product?.ean);
    if (!product || !shoppingItem) return;

    const quantity = shoppingItem.amount || 1;

    product.chains?.forEach((chain) => {
      const prices = readChainPrices(chain);
      if (!prices) return;

      const existing = chainMap.get(chain.chain);

      if (!existing) {
        chainMap.set(chain.chain, {
          chain: chain.chain,
          totalMin: prices.min * quantity,
          totalAvg: prices.avg * quantity,
          totalMax: prices.max * quantity,
          itemCount: 1,
          oldestPriceDate: chain.price_date,
        });
        return;
      }

      existing.totalMin += prices.min * quantity;
      existing.totalAvg += prices.avg * quantity;
      existing.totalMax += prices.max * quantity;
      existing.itemCount += 1;
      existing.oldestPriceDate =
        chain.price_date < existing.oldestPriceDate
          ? chain.price_date
          : existing.oldestPriceDate;
    });
  });

  return Array.from(chainMap.values()).map((totals): ChainSummary => ({
    chain: totals.chain,
    code: "",
    name: "",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: totals.totalMin.toFixed(2),
    avg_price: totals.totalAvg.toFixed(2),
    max_price: totals.totalMax.toFixed(2),
    price_date: totals.oldestPriceDate as `${number}-${number}-${number}`,
    itemCount: totals.itemCount,
  }));
}
