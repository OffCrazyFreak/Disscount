import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { useListShareText } from "@/app/[locale]/(user)/shopping-lists/hooks/use-list-share-text";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";
import type { ProductResponse } from "@/lib/cijene-api/schemas";
import type { ShoppingListDto, ShoppingListItemDto } from "@/lib/api/types";
import { renderHookWithProviders } from "@/test/render";
import { UNSET_ITEM_FIELDS } from "@/test/unset-item-fields";

vi.mock("@/context/user-context", () => ({
  useUser: () => ({ user: null }),
}));

const LIST_ID = "list-1";

function item(
  name: string,
  ean: string | null,
  overrides: Partial<ShoppingListItemDto> = {},
): ShoppingListItemDto {
  return {
    ...UNSET_ITEM_FIELDS,
    id: name,
    ean,
    name,
    amount: 1,
    isChecked: false,
    shoppingListId: LIST_ID,
    createdAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

function chain(code: string, price: string) {
  return {
    chain: code,
    code: "1",
    name: "Proizvod",
    brand: null,
    category: null,
    unit: null,
    quantity: null,
    min_price: price,
    max_price: price,
    avg_price: price,
    price_date: "2026-11-01",
  };
}

/** Sold at Spar for less than at Konzum, so Spar is the suggestion. */
function product(ean: string): ProductResponse {
  return {
    ean,
    brand: null,
    name: "Proizvod",
    quantity: null,
    unit: null,
    chains: [chain("konzum", "2.00"), chain("spar", "1.50")],
  };
}

function shareTextFor(items: ShoppingListItemDto[], cachedEans: string[]) {
  const queryClient = new QueryClient();
  for (const ean of cachedEans) {
    queryClient.setQueryData(CIJENE_QUERY_KEYS.productByEan(ean), product(ean));
  }

  const list: ShoppingListDto = {
    id: LIST_ID,
    title: "Tjedna kupnja",
    ownerId: null,
    linkAccess: "NONE",
    myAccess: "OWNER",
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T10:00:00",
    items,
  };
  const { result } = renderHookWithProviders(() => useListShareText(), {
    queryClient,
  });

  return result.current(list);
}

describe("useListShareText", () => {
  it("names the suggested chain for an item nobody picked a store for", () => {
    const text = shareTextFor([item("Mlijeko", "111")], ["111"]);

    expect(text).toContain("Mlijeko - Spar");
  });

  it("keeps a picked chain over the suggestion", () => {
    const text = shareTextFor(
      [item("Mlijeko", "111", { chainCode: "konzum" })],
      ["111"],
    );

    expect(text).toContain("Mlijeko - Konzum");
  });

  it("names no store for a ticked item with none saved, as its select shows none", () => {
    const text = shareTextFor(
      [item("Mlijeko", "111", { isChecked: true })],
      ["111"],
    );

    expect(text).toContain("~Mlijeko~");
  });

  it("names no store when the prices are not loaded", () => {
    const text = shareTextFor([item("Mlijeko", "111")], []);

    expect(text).toMatch(/Mlijeko\n/);
  });

  it("orders unpicked items by their suggested chain", () => {
    const text = shareTextFor(
      [item("Jaja", "111"), item("Brašno", "222", { chainCode: "konzum" })],
      ["111"],
    );

    expect(text.indexOf("Brašno - Konzum")).toBeLessThan(
      text.indexOf("Jaja - Spar"),
    );
  });
});
