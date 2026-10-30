import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { cardRetryDelay, shouldRetryCardWrite } from "@/lib/offline/card-retry";

function httpError(status: number) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
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

  it("keeps retrying a transient failure however many times it failed", () => {
    expect(shouldRetryCardWrite(50, httpError(503))).toBe(true);
  });
});

describe("cardRetryDelay", () => {
  it("backs off and caps", () => {
    expect(cardRetryDelay(0)).toBe(1000);
    expect(cardRetryDelay(2)).toBe(4000);
    expect(cardRetryDelay(10)).toBe(30_000);
  });
});
