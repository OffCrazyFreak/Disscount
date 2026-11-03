import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  getAllUserShoppingListItems,
  getShoppingListById,
} from "@/lib/api/shopping-lists/queries";
import { server } from "@/test/msw-server";

const LIST_ID = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

const storedItem = {
  id: "7c1e2a4b-3d5f-4a6b-8c9d-0e1f2a3b4c5d",
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

describe("shopping list fetchers", () => {
  it("returns a list the backend sent in the expected shape", async () => {
    server.use(
      http.get("*/api/shopping-lists/:id", () => HttpResponse.json(storedList)),
    );

    await expect(getShoppingListById(LIST_ID)).resolves.toEqual(storedList);
  });

  it("rejects a list whose items lost a key the backend always sends", async () => {
    const { isChecked: _omitted, ...drifted } = storedItem;
    server.use(
      http.get("*/api/shopping-lists/:id", () =>
        HttpResponse.json({ ...storedList, items: [drifted] }),
      ),
    );

    await expect(getShoppingListById(LIST_ID)).rejects.toBeInstanceOf(ZodError);
  });

  it("rejects an item listing with a wrongly typed field", async () => {
    server.use(
      http.get("*/api/shopping-lists/items", () =>
        HttpResponse.json([{ ...storedItem, amount: "1" }]),
      ),
    );

    await expect(getAllUserShoppingListItems()).rejects.toBeInstanceOf(
      ZodError,
    );
  });
});
