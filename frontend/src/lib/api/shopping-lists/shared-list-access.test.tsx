import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";

import { setAuthTokenUser } from "@/lib/api/api-base";
import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";
import type { ShoppingListDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderHookWithProviders } from "@/test/render";

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";

const sharedList: ShoppingListDto = {
  id: LIST_ID,
  title: "Tjedna kupnja",
  ownerId: null,
  linkAccess: null,
  myAccess: "SHOP",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

/** Spring's by-id route lets anyone with the link in; it records whether a bearer came along. */
function serveSharedList() {
  const authorizations: (string | null)[] = [];
  server.use(
    // No session, or one that has expired: better-auth refuses to mint a token.
    http.get("*/api/auth/token", () =>
      HttpResponse.json(null, { status: 401 }),
    ),
    http.get(`*/api/shopping-lists/${LIST_ID}`, ({ request }) => {
      authorizations.push(request.headers.get("Authorization"));
      return HttpResponse.json(sharedList);
    }),
  );
  return authorizations;
}

describe("a shared shopping list link", () => {
  it("opens for a visitor who never signed in", async () => {
    const authorizations = serveSharedList();
    setAuthTokenUser(null);

    const { result } = renderHookWithProviders(() =>
      useGetShoppingListById(LIST_ID),
    );

    await waitFor(() => expect(result.current.data).toEqual(sharedList));
    expect(authorizations).toEqual([null]);
  });

  it("opens anonymously when the tab still names an account whose session expired", async () => {
    const authorizations = serveSharedList();
    setAuthTokenUser("user-a");

    const { result } = renderHookWithProviders(() =>
      useGetShoppingListById(LIST_ID),
    );

    await waitFor(() => expect(result.current.data).toEqual(sharedList));
    expect(authorizations).toEqual([null]);
  });
});
