import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import {
  CARD_LIMIT_KEY,
  cardWriteMessage,
  failureAction,
} from "@/lib/offline/failure-policy";

function httpError(status: number, data: unknown = {}) {
  return new AxiosError("x", "ERR", undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

describe("failureAction", () => {
  it("keeps the entry on network failures", () => {
    expect(failureAction(new AxiosError("Network Error"))).toBe("keep");
  });

  it.each([401, 408, 429, 500, 503, 403])("keeps on %i", (status) => {
    expect(failureAction(httpError(status))).toBe("keep");
  });

  it.each([400, 404, 409, 413, 422])("drops on %i", (status) => {
    expect(failureAction(httpError(status))).toBe("drop");
  });

  it("keeps on an error that is not an HTTP answer", () => {
    expect(failureAction(new Error("boom"))).toBe("keep");
  });
});

describe("cardWriteMessage", () => {
  it("is silent for a card deleted elsewhere", () => {
    expect(cardWriteMessage(httpError(404))).toBeNull();
  });

  it.each([
    "Dosegnut je najveći broj kartica.",
    "You've reached the card limit.",
  ])("names the limit from its code whatever the language (%s)", (detail) => {
    const limit = httpError(409, {
      status: 409,
      code: "error.card.limitReached",
      detail,
    });
    expect(cardWriteMessage(limit)).toBe(CARD_LIMIT_KEY);
  });

  it("treats any other conflict as already saved", () => {
    expect(cardWriteMessage(httpError(409, { detail: "Sukob" }))).toBeNull();
  });

  it("falls back to the generic message", () => {
    expect(cardWriteMessage(httpError(500))).toBe("offline.cardSaveFailed");
  });
});
