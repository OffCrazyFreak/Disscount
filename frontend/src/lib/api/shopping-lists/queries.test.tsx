import { http, HttpResponse, type JsonBodyType } from "msw";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  addItemToShoppingList,
  copyShoppingList,
  createShoppingList,
  getAllUserShoppingListItems,
  getCurrentUserShoppingLists,
  getShoppingListById,
  updateShoppingList,
  updateShoppingListItem,
} from "@/lib/api/shopping-lists/queries";
import { server } from "@/test/msw-server";

const ITEM_ID = "7c1e2a4b-3d5f-4a6b-8c9d-0e1f2a3b4c5d";
const LIST_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

const storedItem = {
  id: ITEM_ID,
  shoppingListId: LIST_ID,
  ean: null,
  brand: null,
  name: "Kruh",
  quantity: null,
  unit: null,
  amount: 1,
  isChecked: false,
  chainCode: null,
  avgPrice: null,
  storePrice: null,
  createdAt: "2026-11-03T09:15:00",
  updatedAt: "2026-11-03T09:15:00",
  updatedByUserId: null,
};

const storedList = {
  id: LIST_ID,
  title: "Tjedna kupnja",
  ownerId: "user-1",
  linkAccess: null,
  myAccess: "EDIT",
  createdAt: "2026-11-03T09:00:00",
  updatedAt: "2026-11-03T09:15:00",
  items: [storedItem],
};

const { isChecked: _omitted, ...driftedItem } = storedItem;
const driftedList = { ...storedList, items: [driftedItem] };
const listRequest = { title: "Tjedna kupnja" };
const itemRequest = { name: "Kruh", amount: 1, isChecked: false };

type Method = "get" | "post" | "put";

// One row per fetcher that returns a body: the route it calls, a well formed answer and a drifted one.
const fetchers: [
  string,
  Method,
  string,
  () => Promise<unknown>,
  JsonBodyType,
  JsonBodyType,
][] = [
  [
    "createShoppingList",
    "post",
    "*/api/shopping-lists",
    () => createShoppingList(listRequest),
    storedList,
    driftedList,
  ],
  [
    "getCurrentUserShoppingLists",
    "get",
    "*/api/shopping-lists/me",
    getCurrentUserShoppingLists,
    [storedList],
    [driftedList],
  ],
  [
    "getShoppingListById",
    "get",
    "*/api/shopping-lists/:id",
    () => getShoppingListById(LIST_ID),
    storedList,
    driftedList,
  ],
  [
    "updateShoppingList",
    "put",
    "*/api/shopping-lists/:id",
    () => updateShoppingList(LIST_ID, listRequest),
    storedList,
    driftedList,
  ],
  [
    "copyShoppingList",
    "post",
    "*/api/shopping-lists/:id/copy",
    () =>
      copyShoppingList(LIST_ID, {
        title: "Kopija",
        includeItems: true,
        includeProgress: false,
        includeSharing: false,
      }),
    storedList,
    driftedList,
  ],
  [
    "addItemToShoppingList",
    "post",
    "*/api/shopping-lists/:id/items",
    () => addItemToShoppingList(LIST_ID, itemRequest),
    storedItem,
    { ...storedItem, amount: "1" },
  ],
  [
    "updateShoppingListItem",
    "put",
    "*/api/shopping-lists/:id/items/:itemId",
    () => updateShoppingListItem(LIST_ID, ITEM_ID, itemRequest),
    storedItem,
    driftedItem,
  ],
  [
    "getAllUserShoppingListItems",
    "get",
    "*/api/shopping-lists/items",
    getAllUserShoppingListItems,
    [storedItem],
    [driftedItem],
  ],
];

describe.each(fetchers)(
  "%s",
  (_name, method, route, fetch, stored, drifted) => {
    it("returns a body the backend sent in the expected shape", async () => {
      server.use(http[method](route, () => HttpResponse.json(stored)));

      await expect(fetch()).resolves.toEqual(stored);
    });

    it("rejects a body that drifted from the schema", async () => {
      server.use(http[method](route, () => HttpResponse.json(drifted)));

      await expect(fetch()).rejects.toBeInstanceOf(ZodError);
    });
  },
);
