import { describe, expect, it } from "vitest";

import { isLimitReached, limitReachedOf } from "@/lib/limits/limit-reached";
import { httpError } from "@/test/http-error";

describe("limitReachedOf", () => {
  it("reads the limit and its size from the refusal", () => {
    const refusal = httpError(409, {
      status: 409,
      code: "error.limit.shoppingLists",
      limit: "SHOPPING_LISTS",
      max: 50,
    });

    expect(limitReachedOf(refusal)).toEqual({
      status: 409,
      limit: "SHOPPING_LISTS",
      max: 50,
    });
  });

  it("ignores a conflict that names no limit", () => {
    expect(
      isLimitReached(httpError(409, { status: 409, code: "conflict" })),
    ).toBe(false);
  });

  it("ignores a limit it does not know", () => {
    const unknown = httpError(409, {
      status: 409,
      limit: "FAVORITES",
      max: 50,
    });

    expect(isLimitReached(unknown)).toBe(false);
  });

  it("ignores anything that is not an HTTP answer", () => {
    expect(isLimitReached(new Error("boom"))).toBe(false);
  });
});
