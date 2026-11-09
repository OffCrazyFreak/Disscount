import type {
  ChainProductResponse,
  ProductResponse,
} from "@/lib/cijene-api/schemas";

/** One chain's cijene-api prices for a product. `max` and `avg` default to `min`. */
export function chain(
  chainCode: string,
  min: string,
  max = min,
  avg = min,
): ChainProductResponse {
  return {
    chain: chainCode,
    code: "1",
    name: "Mlijeko",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: min,
    max_price: max,
    avg_price: avg,
    price_date: "2026-10-13",
  };
}

export function product(
  chains: ChainProductResponse[] = [],
  overrides: Partial<ProductResponse> = {},
): ProductResponse {
  return {
    ean: "1",
    brand: null,
    name: null,
    quantity: null,
    unit: null,
    chains,
    ...overrides,
  };
}
