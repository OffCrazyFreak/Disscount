import * as Sentry from "@sentry/nextjs";
import {
  CancelledError,
  MutationObserver,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { AxiosError, CanceledError } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createQueryClientConfig,
  isUnexpectedFailure,
  shouldRetryQuery,
} from "@/lib/api/query-client-defaults";
import { httpError } from "@/test/http-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const networkFailure = () => new AxiosError("Network Error", "ERR_NETWORK");
const parseFailure = () => z.object({ id: z.number() }).safeParse({}).error;

afterEach(() => {
  onlineManager.setOnline(true);
  vi.clearAllMocks();
});

describe("shouldRetryQuery", () => {
  it.each([400, 401, 403, 404, 409, 422])("never retries a %i", (status) => {
    expect(shouldRetryQuery(0, httpError(status))).toBe(false);
  });

  it.each([408, 429, 500, 503])("retries a %i once", (status) => {
    expect(shouldRetryQuery(0, httpError(status))).toBe(true);
    expect(shouldRetryQuery(1, httpError(status))).toBe(false);
  });

  it("retries a network failure, which React Query pauses while offline", () => {
    expect(shouldRetryQuery(0, networkFailure())).toBe(true);
  });

  it("does not retry a response that failed to parse", () => {
    expect(shouldRetryQuery(0, parseFailure())).toBe(false);
  });
});

describe("isUnexpectedFailure", () => {
  it.each([500, 502, 503])("reports a %i", (status) => {
    expect(isUnexpectedFailure(httpError(status))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422, 429])(
    "does not report a %i",
    (status) => {
      expect(isUnexpectedFailure(httpError(status))).toBe(false);
    },
  );

  it("reports a network failure while online", () => {
    expect(isUnexpectedFailure(networkFailure())).toBe(true);
  });

  it("does not report a network failure while offline", () => {
    onlineManager.setOnline(false);

    expect(isUnexpectedFailure(networkFailure())).toBe(false);
  });

  it("does not report a failed fetch() while offline", () => {
    onlineManager.setOnline(false);

    expect(isUnexpectedFailure(new TypeError("Failed to fetch"))).toBe(false);
  });

  it("reports a parse failure", () => {
    expect(isUnexpectedFailure(parseFailure())).toBe(true);
  });

  it("does not report a cancelled request", () => {
    expect(isUnexpectedFailure(new CancelledError())).toBe(false);
    expect(isUnexpectedFailure(new CanceledError())).toBe(false);
    expect(isUnexpectedFailure(new DOMException("aborted", "AbortError"))).toBe(
      false,
    );
  });
});

describe("createQueryClientConfig", () => {
  it("reports an unexpected query failure tagged with the key root only", async () => {
    const client = new QueryClient(createQueryClientConfig());
    const error = httpError(500);

    await expect(
      client.fetchQuery({
        queryKey: ["shopping-lists", "private-id"],
        queryFn: () => Promise.reject(error),
        retry: false,
      }),
    ).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { queryKeyRoot: "shopping-lists", httpStatus: 500 },
      fingerprint: ["{{ default }}", "shopping-lists", "500"],
    });
  });

  it("reports a failing query once until it succeeds again", async () => {
    const client = new QueryClient(createQueryClientConfig());
    const queryKey = ["shoppingLists", "shared"];
    const fail = () =>
      client
        .fetchQuery({
          queryKey,
          queryFn: () => Promise.reject(httpError(502)),
          retry: false,
          staleTime: 0,
        })
        .catch(() => undefined);

    await fail();
    await fail();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);

    await client.fetchQuery({ queryKey, queryFn: () => "ok", staleTime: 0 });
    await fail();
    expect(Sentry.captureException).toHaveBeenCalledTimes(2);
  });

  it("applies the defaults, and a query's own staleTime wins", () => {
    const client = new QueryClient(createQueryClientConfig());
    const defaults = client.defaultQueryOptions({ queryKey: ["users"] });

    expect(defaults.staleTime).toBe(60_000);
    expect(defaults.retry).toBe(shouldRetryQuery);
    expect(
      client.defaultQueryOptions({ queryKey: ["cijene"], staleTime: 5 })
        .staleTime,
    ).toBe(5);
  });

  it("does not report a query the server answered with 404", async () => {
    const client = new QueryClient(createQueryClientConfig());

    await expect(
      client.fetchQuery({
        queryKey: ["cijene", "product"],
        queryFn: () => Promise.reject(httpError(404)),
      }),
    ).rejects.toThrow();

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports an unexpected mutation failure", async () => {
    const client = new QueryClient(createQueryClientConfig());
    const error = httpError(503);
    const observer = new MutationObserver(client, {
      mutationKey: ["watchlist", "add"],
      mutationFn: () => Promise.reject(error),
    });

    await expect(observer.mutate()).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { queryKeyRoot: "watchlist", httpStatus: 503 },
      fingerprint: ["{{ default }}", "watchlist", "503"],
    });
  });

  it("tags a mutation without a key as unknown", async () => {
    const client = new QueryClient(createQueryClientConfig());
    const observer = new MutationObserver(client, {
      mutationFn: () => Promise.reject(parseFailure()),
    });

    await expect(observer.mutate()).rejects.toBeDefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(expect.anything(), {
      tags: { queryKeyRoot: "unknown", httpStatus: "none" },
      fingerprint: undefined,
    });
  });
});
