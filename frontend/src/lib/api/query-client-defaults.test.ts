import * as Sentry from "@sentry/nextjs";
import {
  CancelledError,
  MutationObserver,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { AxiosError, CanceledError, type AxiosResponse } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createQueryClientConfig,
  isUnexpectedFailure,
  shouldRetryQuery,
} from "@/lib/api/query-client-defaults";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

function httpError(status: number) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data: {},
  } as AxiosResponse);
}

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
      tags: { queryKeyRoot: "shopping-lists" },
    });
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
      tags: { queryKeyRoot: "watchlist" },
    });
  });
});
