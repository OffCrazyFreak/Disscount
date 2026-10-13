import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import {
  CARD_LIMIT_MESSAGE,
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

  it("names the limit only for the limit conflict", () => {
    const limit = httpError(409, {
      status: 409,
      detail: "Dosegnut je najveći broj kartica",
    });
    expect(cardWriteMessage(limit)).toBe(CARD_LIMIT_MESSAGE);
  });

  it("treats any other conflict as already saved", () => {
    expect(cardWriteMessage(httpError(409, { detail: "Sukob" }))).toBeNull();
  });

  it("falls back to the generic message", () => {
    expect(cardWriteMessage(httpError(500))).toBe(
      "Kartica nije spremljena. Pokušaj ponovno.",
    );
  });
});
