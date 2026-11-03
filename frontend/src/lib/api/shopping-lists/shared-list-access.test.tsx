import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import type { ShoppingListDto } from "@/lib/api/types";
import { setCacheIdentity } from "@/lib/offline/cache-identity";
import { ANONYMOUS, actingAs } from "@/test/backend-identity";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";

const sharedList: ShoppingListDto = {
  id: LIST_ID,
  title: "Tjedna kupnja",
  linkAccess: null,
  myAccess: "SHOP",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

/** Spring's by-id route lets anyone with the link in; it records whom each call acted as. No session cookie is set. */
function serveSharedList() {
  const accounts: string[] = [];
  server.use(
    http.get(`*/api/shopping-lists/${LIST_ID}`, ({ request }) => {
      accounts.push(actingAs(request));
      return HttpResponse.json(sharedList);
    }),
  );
  return accounts;
}

describe("a shared shopping list link", () => {
  it("opens for a visitor who never signed in", async () => {
    const accounts = serveSharedList();
    setCacheIdentity(null);

    const { result } = renderHookWithProviders(() =>
      useGetShoppingListById(LIST_ID),
    );

    await waitFor(() => expect(result.current.data).toEqual(sharedList));
    expect(accounts).toEqual([ANONYMOUS]);
  });

  it("opens anonymously when the tab still names an account whose session expired", async () => {
    const accounts = serveSharedList();
    setCacheIdentity("user-a");

    const { result } = renderHookWithProviders(() =>
      useGetShoppingListById(LIST_ID),
    );

    await waitFor(() => expect(result.current.data).toEqual(sharedList));
    expect(accounts).toEqual([ANONYMOUS]);
  });
});
