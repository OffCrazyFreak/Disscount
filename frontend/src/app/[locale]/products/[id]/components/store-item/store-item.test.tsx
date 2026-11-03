import { useState } from "react";
import { vi } from "vitest";

import StoreItem from "@/app/[locale]/products/[id]/components/store-item/store-item";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import { describeChainCard } from "@/test/chain-card-contract";
import type { INearestStore } from "@/utils/nearest-chain-distance";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ accountUser: null }),
}));

vi.mock(
  "@/app/[locale]/products/[id]/components/store-item/store-prices-details",
  () => ({ default: () => <p>DETAILS</p> }),
);

const store: ChainProductResponse = {
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
};

const product = { ean: "1", chains: [store] } as unknown as ProductResponse;

function Card({ nearest }: { nearest?: INearestStore }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <StoreItem
      store={store}
      storePrices={[]}
      pricesStatus="success"
      product={product}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((open) => !open)}
      nearest={nearest}
    />
  );
}

describeChainCard("Product", (nearest) => <Card nearest={nearest} />);
