import { screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import ShoppingListUpdateStatus from "@/app/[locale]/(user)/shopping-lists/[id]/components/shopping-list-update-status";
import type { ShoppingListDto } from "@/lib/api/types";
import { OFFLINE_MUTATION_KEYS } from "@/lib/offline/offline-mutation-keys";
import { renderWithProviders } from "@/test/render";

const FIRST_FETCH = 1_000_000;
const NEXT_FETCH = FIRST_FETCH + 5_000;

function makeList(overrides: Partial<ShoppingListDto> = {}): ShoppingListDto {
  return {
    id: "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70",
    title: "Tjedna kupnja",
    ownerId: null,
    linkAccess: null,
    myAccess: "SHOP",
    updatedAt: "2026-11-01T10:00:00",
    createdAt: "2026-11-01T09:00:00",
    items: [],
    ...overrides,
  };
}

const changedList = makeList({ updatedAt: "2026-11-01T10:00:05" });

function statusElement(list: ShoppingListDto, fetchedAt: number) {
  return <ShoppingListUpdateStatus shoppingList={list} fetchedAt={fetchedAt} />;
}

interface IRenderOptions {
  queryClient?: QueryClient;
  locale?: "en";
}

function renderStatus(
  list: ShoppingListDto,
  { queryClient = new QueryClient(), locale }: IRenderOptions = {},
) {
  return renderWithProviders(statusElement(list, FIRST_FETCH), {
    queryClient,
    locale,
  });
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

    rerender(statusElement(changedList, NEXT_FETCH));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Netko je upravo promijenio popis.",
    );
  });

  it("speaks the page language", () => {
    const { rerender } = renderStatus(makeList(), { locale: "en" });

    rerender(statusElement(changedList, NEXT_FETCH));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Someone just changed this list.",
    );
  });

  it("stays quiet when the change came from your own write", () => {
    const queryClient = new QueryClient();
    const { rerender } = renderStatus(makeList(), { queryClient });

    addWrite(queryClient, "success", FIRST_FETCH + 1_000);
    rerender(statusElement(changedList, NEXT_FETCH));

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays quiet when your write was still in flight as the last version landed", () => {
    const queryClient = new QueryClient();
    const write = addWrite(queryClient, "pending", FIRST_FETCH - 1_000);
    const { rerender } = renderStatus(makeList(), { queryClient });

    write.state.status = "success";
    rerender(statusElement(changedList, NEXT_FETCH));

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("announces again once a refetch lands after your write settled", () => {
    const queryClient = new QueryClient();
    const write = addWrite(queryClient, "pending", FIRST_FETCH - 1_000);
    const { rerender } = renderStatus(makeList(), { queryClient });

    write.state.status = "success";
    rerender(statusElement(makeList(), NEXT_FETCH));
    rerender(statusElement(changedList, NEXT_FETCH + 5_000));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Netko je upravo promijenio popis.",
    );
  });

  it("still announces when your only write was submitted before the last fetch", () => {
    const queryClient = new QueryClient();
    addWrite(queryClient, "success", FIRST_FETCH - 1_000);
    const { rerender } = renderStatus(makeList(), { queryClient });

    rerender(statusElement(changedList, NEXT_FETCH));

    expect(screen.getByRole("status")).toHaveTextContent(
      "Netko je upravo promijenio popis.",
    );
  });

  it("stays quiet when a cached list opened later refetches your own write", () => {
    const queryClient = new QueryClient();
    addWrite(queryClient, "success", FIRST_FETCH + 60_000);
    const { rerender } = renderStatus(makeList(), { queryClient });

    rerender(statusElement(changedList, FIRST_FETCH + 90_000));

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("stays quiet on a private list", () => {
    const privateList = makeList({ myAccess: "OWNER", linkAccess: "NONE" });
    const { rerender } = renderStatus(privateList);

    rerender(
      statusElement(
        { ...privateList, updatedAt: "2026-11-01T10:00:05" },
        NEXT_FETCH,
      ),
    );

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
