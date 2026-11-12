import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw/http";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import PhotoQueueTab from "@/app/[locale]/dashboard/components/product-photos/photo-queue-tab";
import hr from "@/i18n/messages/hr";
import { PRODUCT_IMAGE_KEYS } from "@/lib/api/product-images/keys";
import type { AdminPhotoQueueItem } from "@/lib/api/types";
import { server } from "@/test/msw-server";
import { renderWithProviders } from "@/test/render";

// The real manager loads a whole product; this one names the open product and refreshes the queue on review.
vi.mock("@/components/custom/product-photos/photo-manager", () => ({
  default: function FakePhotoManager({
    ean,
    onReviewed,
  }: {
    ean: string;
    onReviewed?: () => void;
  }) {
    const queryClient = useQueryClient();

    function review() {
      void queryClient.invalidateQueries({
        queryKey: PRODUCT_IMAGE_KEYS.queueAll,
      });
      onReviewed?.();
    }

    return (
      <div>
        <p>open {ean}</p>
        <button type="button" onClick={review}>
          reviewed
        </button>
      </div>
    );
  },
}));

const PAGE_SIZE = 2;

function item(ean: string): AdminPhotoQueueItem {
  return {
    ean,
    name: `Proizvod ${ean}`,
    brand: null,
    storeListings: 1,
    chainCount: 1,
    previewUrl: null,
    pendingCount: 0,
    reportedCount: 0,
    reviewedAt: null,
  };
}

/** Serves the queue in pages of two and drops a product once it is reviewed, like the "to review" filter. */
function serveQueue(eans: string[]) {
  const left = [...eans];
  const requested: number[] = [];

  server.use(
    http.get("*/api/admin/product-images/queue", ({ request }) => {
      const number = Number(new URL(request.url).searchParams.get("page"));
      requested.push(number);
      const start = number * PAGE_SIZE;

      return HttpResponse.json({
        items: left.slice(start, start + PAGE_SIZE).map(item),
        page: {
          number,
          size: PAGE_SIZE,
          totalItems: left.length,
          totalPages: Math.ceil(left.length / PAGE_SIZE),
        },
        reviewedCount: eans.length - left.length,
      });
    }),
  );

  return {
    requested,
    review: (ean: string) => left.splice(left.indexOf(ean), 1),
  };
}

function renderTab() {
  renderWithProviders(<PhotoQueueTab />, {
    queryClient: new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  });
}

function queueList() {
  return screen.getByRole("list", { name: hr.productPhotos.queue.listLabel });
}

describe("PhotoQueueTab", () => {
  // jsdom lacks the scrolling API the list calls to keep the selected row in view.
  beforeEach(() => {
    Element.prototype.scrollIntoView ??= () => {};
  });

  it("loads the next page when the list is scrolled near its end", async () => {
    const queue = serveQueue(["1", "2", "3"]);
    renderTab();

    expect(await screen.findByText("Proizvod 2")).toBeInTheDocument();
    expect(screen.queryByText("Proizvod 3")).toBeNull();

    fireEvent.scroll(queueList());

    expect(await screen.findByText("Proizvod 3")).toBeInTheDocument();
    expect(within(queueList()).getByText("#3")).toBeInTheDocument();
    expect(queue.requested).toStrictEqual([0, 1]);
  });

  it("opens the product after the reviewed one, even across a page edge", async () => {
    const queue = serveQueue(["1", "2", "3"]);
    renderTab();
    await screen.findByText("Proizvod 2");
    fireEvent.scroll(queueList());
    await screen.findByText("Proizvod 3");

    await userEvent.click(screen.getByText("Proizvod 2"));
    expect(screen.getByText("open 2")).toBeInTheDocument();

    queue.review("2");
    await userEvent.click(screen.getByRole("button", { name: "reviewed" }));

    expect(await screen.findByText("open 3")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Proizvod 2")).toBeNull());
    expect(screen.getByText("open 3")).toBeInTheDocument();
  });

  it("loads the next page when J moves the selection to the last loaded product", async () => {
    // jsdom has no layout, so scrolling a row into view stands in for the list box scrolling with it.
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function scrollList(this: Element) {
      this.closest("ol")?.dispatchEvent(new Event("scroll"));
    };
    onTestFinished(() => {
      Element.prototype.scrollIntoView = original;
    });

    const queue = serveQueue(["1", "2", "3"]);
    renderTab();
    await screen.findByText("open 1");

    await userEvent.keyboard("j");

    expect(await screen.findByText("open 2")).toBeInTheDocument();
    expect(await screen.findByText("Proizvod 3")).toBeInTheDocument();
    expect(queue.requested).toStrictEqual([0, 1]);
  });
});
