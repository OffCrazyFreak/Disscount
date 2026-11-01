import { screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import ShoppingListUpdateStatus from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-update-status";
import type { ShoppingListDto } from "@/lib/api/types";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { renderWithProviders } from "@/test/render";

function makeList(overrides: Partial<ShoppingListDto> = {}): ShoppingListDto {
  return {
    id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
    title: "Tjedna kupnja",
    linkAccess: null,
    myAccess: "SHOP",
    updatedAt: "2026-11-01T10:00:00",
    createdAt: "2026-11-01T09:00:00",
    items: [],
    ...overrides,
  };
}

function renderStatus(list: ShoppingListDto, locale?: "en") {
  const queryClient = new QueryClient();
  const view = renderWithProviders(
    <ShoppingListUpdateStatus shoppingList={list} />,
    { queryClient, locale },
  );
  return { ...view, queryClient };
}

// A list write in the cache, as the mutation hooks leave behind.
function addWrite(
  queryClient: QueryClient,
  status: "pending" | "success",
  submittedAt: number,
) {
  return queryClient.getMutationCache().build(
    queryClient,
    { mutationKey: OFFLINE_MUTATION_KEYS.shoppingListItemUpdate },
    {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status,
      variables: undefined,
      submittedAt,
    },
  );
}

describe("ShoppingListUpdateStatus", () => {
  it("announces a change someone else made to a shared list", () => {
    const { rerender } = renderStatus(makeList());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    rerender(
      <ShoppingListUpdateStatus
        shoppingList={makeList({ updatedAt: "2026-11-01T10:00:05" })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Popis je ažuriran");
  });

  it("speaks the page language", () => {
    const { rerender } = renderStatus(makeList(), "en");

    rerender(
      <ShoppingListUpdateStatus
        shoppingList={makeList({ updatedAt: "2026-11-01T10:00:05" })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("List updated");
  });

  it("stays quiet when the change came from your own write", () => {
    const { rerender, queryClient } = renderStatus(makeList());

    addWrite(queryClient, "success", Date.now() + 1);
    rerender(
      <ShoppingListUpdateStatus
        shoppingList={makeList({ updatedAt: "2026-11-01T10:00:05" })}
      />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays quiet when your write was still in flight as the last version landed", () => {
    const queryClient = new QueryClient();
    const write = addWrite(queryClient, "pending", Date.now() - 1_000);
    const { rerender } = renderWithProviders(
      <ShoppingListUpdateStatus shoppingList={makeList()} />,
      { queryClient },
    );

    write.state.status = "success";
    rerender(
      <ShoppingListUpdateStatus
        shoppingList={makeList({ updatedAt: "2026-11-01T10:00:05" })}
      />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("still announces when your only write finished before the last version", () => {
    const queryClient = new QueryClient();
    addWrite(queryClient, "success", Date.now() - 1_000);
    const { rerender } = renderWithProviders(
      <ShoppingListUpdateStatus shoppingList={makeList()} />,
      { queryClient },
    );

    rerender(
      <ShoppingListUpdateStatus
        shoppingList={makeList({ updatedAt: "2026-11-01T10:00:05" })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Popis je ažuriran");
  });

  it("stays quiet on a private list", () => {
    const privateList = makeList({ myAccess: "OWNER", linkAccess: "NONE" });
    const { rerender } = renderStatus(privateList);

    rerender(
      <ShoppingListUpdateStatus
        shoppingList={{ ...privateList, updatedAt: "2026-11-01T10:00:05" }}
      />,
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
