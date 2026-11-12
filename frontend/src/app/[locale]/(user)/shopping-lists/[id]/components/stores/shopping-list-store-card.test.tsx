import { vi } from "vitest";

import ShoppingListStoreItem from "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-store-card";
import type { ChainSummary } from "@/app/[locale]/(user)/shopping-lists/[id]/typings/store-chain-types";
import type { ShoppingListDto } from "@/lib/api/types";
import { describeChainCard } from "@/test/chain-card-contract";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ accountUser: null }),
}));

vi.mock(
  "@/app/[locale]/(user)/shopping-lists/[id]/components/stores/shopping-list-items-table",
  () => ({ default: () => <p>DETAILS</p> }),
);

const chain: ChainSummary = {
  chain: "konzum",
  code: "1",
  name: "Mlijeko",
  brand: null,
  category: null,
  unit: null,
  quantity: null,
  min_price: "1.00",
  max_price: "2.00",
  avg_price: "1.50",
  price_date: "2026-11-04",
  itemCount: 0,
};

const shoppingList = { items: [] } as unknown as ShoppingListDto;

describeChainCard("Shopping list", (nearest) => (
  <ShoppingListStoreItem
    chain={chain}
    shoppingList={shoppingList}
    absoluteMinPrice={1}
    absoluteMaxPrice={2}
    productsData={[]}
    hasLowestPriceItem={false}
    hasHighestPriceItem={false}
    nearest={nearest}
  />
));
