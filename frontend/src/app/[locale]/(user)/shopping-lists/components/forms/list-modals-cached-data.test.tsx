import { screen, waitFor } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CopyListModal from "@/app/[locale]/(user)/shopping-lists/components/forms/copy-list-modal";
import ShareListModal from "@/app/[locale]/(user)/shopping-lists/components/forms/share-list-modal";
import hr from "@/i18n/messages/hr";
import { SHOPPING_LIST_QUERY_KEYS } from "@/lib/api/shopping-lists/keys";
import type { ShoppingListDto } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const LIST_ID = "5b0e6c1a-7d2f-4e8a-9c3b-1f4d6a8e2c70";

const LIST: ShoppingListDto = {
  id: LIST_ID,
  title: "Tjedna kupnja",
  ownerId: null,
  linkAccess: "NONE",
  myAccess: "OWNER",
  updatedAt: "2026-11-01T10:00:00",
  createdAt: "2026-11-01T09:00:00",
  items: [],
};

/** A list the cache already holds, whose background refetch then fails. */
function cachedListWithFailingRefetch() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Stale from the start, so mounting the modal refetches.
  queryClient.setQueryData(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID), LIST, {
    updatedAt: 0,
  });
  server.use(
    http.get(`*/api/shopping-lists/${LIST_ID}`, () =>
      HttpResponse.json({ status: 500 }, { status: 500 }),
    ),
  );
  return queryClient;
}

async function refetchFailed(queryClient: QueryClient) {
  await waitFor(() =>
    expect(
      queryClient.getQueryState(SHOPPING_LIST_QUERY_KEYS.byId(LIST_ID))?.status,
    ).toBe("error"),
  );
}

describe("list modals over cached data", () => {
  beforeEach(() => {
    // jsdom has no ResizeObserver; the modal body's scroll fades are all it drives.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it("keeps the share settings when a background refetch fails", async () => {
    const queryClient = cachedListWithFailingRefetch();
    renderWithProviders(<ShareListModal open id={LIST_ID} />, { queryClient });

    await refetchFailed(queryClient);

    expect(screen.queryByText(hr.shoppingLists.modal.notFound)).toBeNull();
  });

  it("keeps the copy form when a background refetch fails", async () => {
    const queryClient = cachedListWithFailingRefetch();
    renderWithProviders(<CopyListModal open id={LIST_ID} />, { queryClient });

    await refetchFailed(queryClient);

    expect(screen.queryByText(hr.shoppingLists.modal.notFound)).toBeNull();
    expect(
      screen.getByRole("button", { name: hr.shoppingLists.copyModal.submit }),
    ).toBeEnabled();
  });
});
