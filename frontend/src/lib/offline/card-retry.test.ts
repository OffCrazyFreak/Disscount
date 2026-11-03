import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { cardRetryDelay, shouldRetryCardWrite } from "@/lib/offline/card-retry";

function httpError(status: number, data: unknown = {}) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

describe("shouldRetryCardWrite", () => {
  it("retries transient statuses", () => {
    for (const status of [401, 408, 429, 503]) {
      expect(shouldRetryCardWrite(0, httpError(status))).toBe(true);
    }
  });

  it("never retries permanent statuses", () => {
    for (const status of [400, 404, 409, 413, 422]) {
      expect(shouldRetryCardWrite(0, httpError(status))).toBe(false);
    }
  });

  it("never retries once the proxy reports another account signed in", () => {
    const refused = httpError(401, { status: 401, code: "session_changed" });
    expect(shouldRetryCardWrite(0, refused)).toBe(false);
  });

  // A write replayed from disk follows the same bound as one started from the page.
  it("gives up on a lasting server answer after the fifth attempt", () => {
    for (const status of [401, 403, 429, 502, 503]) {
      expect(shouldRetryCardWrite(3, httpError(status))).toBe(true);
      expect(shouldRetryCardWrite(4, httpError(status))).toBe(false);
    }
  });

  it("keeps retrying a network failure however many times it failed", () => {
    expect(shouldRetryCardWrite(50, new AxiosError("Network Error"))).toBe(
      true,
    );
  });
});

describe("cardRetryDelay", () => {
  it("backs off and caps", () => {
    expect(cardRetryDelay(0)).toBe(1000);
    expect(cardRetryDelay(2)).toBe(4000);
    expect(cardRetryDelay(10)).toBe(30_000);
  });
});
