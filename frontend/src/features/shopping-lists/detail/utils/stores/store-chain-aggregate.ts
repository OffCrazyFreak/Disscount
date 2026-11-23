import { ShoppingListItemDto } from "@/lib/api/types";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { ChainSummary } from "@/features/shopping-lists/detail/typings/store-chain-types";

interface IChainTotals {
  chain: string;
  totalMin: number;
  totalAvg: number;
  totalMax: number;
  itemCount: number;
  oldestPriceDate: string;
}

export function buildChainAggregates(
  productsData: ProductResponse[],
  activeItems: ShoppingListItemDto[],
): ChainSummary[] {
  const chainMap = new Map<string, IChainTotals>();

  productsData.forEach((product) => {
    const shoppingItem = activeItems.find((item) => item.ean === product.ean);
    if (!shoppingItem) return;

    const quantity = shoppingItem.amount || 1;

    product.chains.forEach((chain) => {
      const existing = chainMap.get(chain.chain);

      if (!existing) {
        chainMap.set(chain.chain, {
          chain: chain.chain,
          totalMin: chain.min_price * quantity,
          totalAvg: chain.avg_price * quantity,
          totalMax: chain.max_price * quantity,
          itemCount: 1,
          oldestPriceDate: chain.price_date,
        });
        return;
      }

      existing.totalMin += chain.min_price * quantity;
      existing.totalAvg += chain.avg_price * quantity;
      existing.totalMax += chain.max_price * quantity;
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
    min_price: Number(totals.totalMin.toFixed(2)),
    avg_price: Number(totals.totalAvg.toFixed(2)),
    max_price: Number(totals.totalMax.toFixed(2)),
    price_date: totals.oldestPriceDate as `${number}-${number}-${number}`,
    itemCount: totals.itemCount,
  }));
}
