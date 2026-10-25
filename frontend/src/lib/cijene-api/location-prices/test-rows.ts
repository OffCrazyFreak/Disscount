import type { StorePrice } from "@/lib/cijene-api/schemas";

/** A store price row with only the fields the reducer reads filled in */
export function storePrice(
  ean: string,
  city: string | null,
  regular: string | null,
  special: string | null = null,
): StorePrice {
  return {
    chain: "konzum",
    ean,
    price_date: "2026-10-25",
    regular_price: regular,
    special_price: special,
    unit_price: null,
    best_price_30: null,
    anchor_price: null,
    store: {
      chain_id: 1,
      code: `${city}-1`,
      type: null,
      address: null,
      city,
      zipcode: null,
      lat: null,
      lon: null,
      phone: null,
    },
  };
}
