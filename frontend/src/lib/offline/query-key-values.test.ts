import { describe, expect, it } from "vitest";

import { ACCOUNT_SESSION_QUERY_KEYS } from "@/lib/api/account-sessions/keys";
import { ADMIN_QUERY_KEYS } from "@/lib/api/admin/keys";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";
import { DIGITAL_CARD_QUERY_KEYS } from "@/lib/api/digital-cards/keys";
import { FAVORITE_STORE_QUERY_KEYS } from "@/lib/api/favorite-stores/keys";
import { PREFERENCE_QUERY_KEYS } from "@/lib/api/preferences/keys";
import { PRODUCT_IMAGE_KEYS } from "@/lib/api/product-images/keys";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import { STORE_NAME_QUERY_KEYS } from "@/lib/api/store-names/keys";
import { WATCHLIST_QUERY_KEYS } from "@/lib/api/watchlist/keys";
import { CIJENE_QUERY_KEYS } from "@/lib/cijene-api/keys";

// The persisted IndexedDB cache is keyed by these values. Each literal is the key as it was
// written inline before the factories existed; a change here strands every user's offline
// copy unless CACHE_BUSTER is bumped, which also discards queued offline writes.
describe("query key factories", () => {
  it("keep the public price data keys", () => {
    expect(CIJENE_QUERY_KEYS.chains).toStrictEqual(["cijene", "chains"]);
    expect(CIJENE_QUERY_KEYS.chainStats).toStrictEqual([
      "cijene",
      "chain-stats",
    ]);
    expect(CIJENE_QUERY_KEYS.health).toStrictEqual(["cijene", "health"]);
    expect(CIJENE_QUERY_KEYS.storeDirectory).toStrictEqual([
      "cijene",
      "store-directory",
    ]);
    expect(CIJENE_QUERY_KEYS.storesByChain("konzum")).toStrictEqual([
      "cijene",
      "stores",
      "chain",
      "konzum",
    ]);
    expect(CIJENE_QUERY_KEYS.storeSearch()).toStrictEqual([
      "cijene",
      "stores",
      "all",
    ]);
    expect(CIJENE_QUERY_KEYS.storeSearch({ city: "Zagreb" })).toStrictEqual([
      "cijene",
      "stores",
      '{"city":"Zagreb"}',
    ]);
    expect(CIJENE_QUERY_KEYS.productByEan("3850104")).toStrictEqual([
      "cijene",
      "product",
      "ean",
      '{"ean":"3850104"}',
    ]);
    expect(
      CIJENE_QUERY_KEYS.product({ ean: "3850104", date: "2026-11-01" }),
    ).toStrictEqual([
      "cijene",
      "product",
      "ean",
      '{"ean":"3850104","date":"2026-11-01"}',
    ]);
    expect(CIJENE_QUERY_KEYS.productSearch({ q: "mlijeko" })).toStrictEqual([
      "cijene",
      "products",
      "search",
      '{"q":"mlijeko"}',
    ]);
    expect(
      CIJENE_QUERY_KEYS.priceHistory("3850104", "2026-11-01"),
    ).toStrictEqual(["cijene", "product", "history", "3850104", "2026-11-01"]);
    expect(
      CIJENE_QUERY_KEYS.locationPrices({
        eans: "1,2",
        chains: "konzum",
        cities: ["Split"],
      }),
    ).toStrictEqual([
      "cijene",
      "prices",
      "locations",
      { eans: "1,2", chains: "konzum", cities: ["Split"] },
    ]);
  });

  it("keeps the store prices key canonical", () => {
    expect(
      CIJENE_QUERY_KEYS.productStorePrices({
        eans: " 2,1, 2",
        chains: "spar,konzum",
        city: " Zagreb ",
      }),
    ).toStrictEqual([
      "cijene",
      "prices",
      "product",
      {
        eans: "1,2",
        chains: "konzum,spar",
        city: "Zagreb",
        address: undefined,
      },
    ]);
  });

  it("keep the keys of our own backend's data", () => {
    expect(SHOPPING_LIST_QUERY_KEYS.all).toStrictEqual(["shoppingLists"]);
    expect(SHOPPING_LIST_QUERY_KEYS.me).toStrictEqual(["shoppingLists", "me"]);
    expect(SHOPPING_LIST_QUERY_KEYS.byId("l1")).toStrictEqual([
      "shoppingLists",
      "l1",
    ]);
    expect(SHOPPING_LIST_QUERY_KEYS.itemsAll).toStrictEqual([
      "shoppingListItems",
    ]);
    expect(SHOPPING_LIST_QUERY_KEYS.myItems).toStrictEqual([
      "shoppingListItems",
      "me",
    ]);

    expect(DIGITAL_CARD_QUERY_KEYS.all).toStrictEqual(["digitalCards"]);
    expect(DIGITAL_CARD_QUERY_KEYS.me).toStrictEqual([
      "digitalCards",
      "v2",
      "me",
    ]);
    expect(DIGITAL_CARD_QUERY_KEYS.config).toStrictEqual([
      "digitalCards",
      "v2",
      "config",
    ]);

    expect(WATCHLIST_QUERY_KEYS.all).toStrictEqual(["watchlist"]);
    expect(WATCHLIST_QUERY_KEYS.me).toStrictEqual(["watchlist", "me"]);
    expect(WATCHLIST_QUERY_KEYS.byProduct("3850104")).toStrictEqual([
      "watchlist",
      "product",
      "3850104",
    ]);

    expect(PREFERENCE_QUERY_KEYS.pinnedStores).toStrictEqual(["pinnedStores"]);
    expect(PREFERENCE_QUERY_KEYS.pinnedPlaces).toStrictEqual(["pinnedPlaces"]);
    expect(FAVORITE_STORE_QUERY_KEYS.all).toStrictEqual(["favoriteStores"]);
    expect(STORE_NAME_QUERY_KEYS.search("kon")).toStrictEqual([
      "storeNames",
      "search",
      "kon",
    ]);

    expect(ACCOUNT_SESSION_QUERY_KEYS.all).toStrictEqual(["account-sessions"]);
    expect(ACCOUNT_SESSION_QUERY_KEYS.list("s1")).toStrictEqual([
      "account-sessions",
      "s1",
    ]);
  });

  it("keep the admin and photo keys", () => {
    expect(ADMIN_QUERY_KEYS.users).toStrictEqual(["admin", "users"]);
    expect(CONTACT_QUERY_KEYS.all).toStrictEqual(["admin", "contact"]);
    expect(CONTACT_QUERY_KEYS.list(true)).toStrictEqual([
      "admin",
      "contact",
      { includeDeleted: true },
    ]);

    expect(PRODUCT_IMAGE_KEYS.product("1")).toStrictEqual([
      "product-images",
      "product",
      "1",
    ]);
    expect(PRODUCT_IMAGE_KEYS.thumbnail("1")).toStrictEqual([
      "product-images",
      "thumbnail",
      "1",
    ]);
    expect(PRODUCT_IMAGE_KEYS.admin).toStrictEqual(["admin", "product-images"]);
    expect(PRODUCT_IMAGE_KEYS.adminProduct("1")).toStrictEqual([
      "admin",
      "product-images",
      "product",
      "1",
    ]);
    expect(PRODUCT_IMAGE_KEYS.queueAll).toStrictEqual([
      "admin",
      "product-images",
      "queue",
    ]);
    expect(PRODUCT_IMAGE_KEYS.queue("pending", 2)).toStrictEqual([
      "admin",
      "product-images",
      "queue",
      "pending",
      2,
    ]);
  });
});
