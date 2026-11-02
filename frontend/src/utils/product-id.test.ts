import { describe, expect, it } from "vitest";
import { isWellFormedProductId } from "@/utils/product-id";

describe("isWellFormedProductId", () => {
  it.each([
    "5449000000996",
    "12345670",
    "00012345678905",
    "123456789012345",
    // In-store code with a check digit that does not add up, priced by a real chain.
    "2831201000000",
    "spar:385864",
    "djelo_vodice:012474",
    "trgovina-krk:123",
  ])("accepts %s", (id) => {
    expect(isWellFormedProductId(id)).toBe(true);
  });

  it.each(["abc", "1234567", "spar:", ":123", "a b:1", ""])(
    "rejects %s",
    (id) => {
      expect(isWellFormedProductId(id)).toBe(false);
    },
  );
});
