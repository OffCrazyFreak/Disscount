import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";

import { cardWriteMessage, failureAction } from "@/lib/offline/failure-policy";
import { httpError } from "@/test/http-error";

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

  it("drops an upload the server refuses because photo storage is off", () => {
    const unavailable = httpError(503, {
      status: 503,
      code: "error.cardPhoto.unavailable",
    });
    expect(failureAction(unavailable)).toBe("drop");
  });

  it("keeps on an error that is not an HTTP answer", () => {
    expect(failureAction(new Error("boom"))).toBe("keep");
  });
});

describe("cardWriteMessage", () => {
  it("is silent for a card deleted elsewhere", () => {
    expect(cardWriteMessage(httpError(404))).toBeNull();
  });

  it("leaves the card cap to the limit dialog", () => {
    const limit = httpError(409, {
      status: 409,
      code: "error.limit.digitalCards",
      limit: "DIGITAL_CARDS",
      max: 50,
    });
    expect(cardWriteMessage(limit)).toBeNull();
  });

  it("treats any other conflict as already saved", () => {
    expect(cardWriteMessage(httpError(409, { detail: "Sukob" }))).toBeNull();
  });

  it("falls back to the generic message", () => {
    expect(cardWriteMessage(httpError(500))).toBe("offline.cardSaveFailed");
  });
});
