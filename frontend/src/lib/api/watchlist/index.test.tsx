import { http, HttpResponse } from "msw/http";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { addToWatchlist } from "@/lib/api/watchlist";
import { WatchType } from "@/lib/api/types";
import { server } from "@/test/msw-server";

const storedItem = {
  id: "9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a",
  userId: "user-1",
  productApiId: "3850123456789",
  watchType: WatchType.percentage,
  thresholdValue: 10,
  lastNotifiedAt: null,
  createdAt: "2026-11-03T09:00:00",
  updatedAt: null,
};

const request = {
  productApiId: storedItem.productApiId,
  watchType: WatchType.percentage,
  thresholdValue: 10,
};

describe("watchlist fetchers", () => {
  it("returns an item the backend sent in the expected shape", async () => {
    server.use(
      http.post("*/api/watchlist", () => HttpResponse.json(storedItem)),
    );

    await expect(addToWatchlist(request)).resolves.toEqual(storedItem);
  });

  it("rejects an item with a watch type the client does not know", async () => {
    server.use(
      http.post("*/api/watchlist", () =>
        HttpResponse.json({ ...storedItem, watchType: "RELATIVE" }),
      ),
    );

    await expect(addToWatchlist(request)).rejects.toBeInstanceOf(ZodError);
  });
});
