import { useState } from "react";
import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import StoreItem from "@/features/products/detail/components/store-item/store-item";
import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";
import { describeChainCard } from "@/test/chain-card-contract";
import { renderWithProviders } from "@/test/render";
import type { INearestStore } from "@/utils/geo/nearest-chain-distance";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ accountUser: null }),
}));

vi.mock(
  "@/features/products/detail/components/store-item/store-prices-details",
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
  min_price: 1,
  max_price: 2,
  avg_price: 1.5,
  price_date: "2026-11-04",
};

const product = { ean: "1", chains: [store] } as unknown as ProductResponse;

function Card({
  nearest,
  today = store.price_date,
}: {
  nearest?: INearestStore;
  today?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <StoreItem
      store={store}
      storePrices={[]}
      pricesStatus="success"
      product={product}
      today={today}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((open) => !open)}
      nearest={nearest}
    />
  );
}

describeChainCard("Product", (nearest) => <Card nearest={nearest} />);

describe("StoreItem price date", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("judges the price date by the rendered day, not the device clock", () => {
    // Past midnight in Zagreb, a day after the page rendered.
    vi.useFakeTimers({
      now: new Date("2026-11-05T00:30:00+01:00"),
      toFake: ["Date"],
    });

    renderWithProviders(<Card today="2026-11-04" />);

    expect(screen.queryByText(/Podaci od/)).not.toBeInTheDocument();
  });

  it("flags prices from an earlier day", () => {
    renderWithProviders(<Card today="2026-11-05" />);

    expect(screen.getByText(/Podaci od/)).toBeInTheDocument();
  });
});
