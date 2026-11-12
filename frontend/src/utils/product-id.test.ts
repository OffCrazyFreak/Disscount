import { describe, expect, it } from "vitest";
import {
  canonicalProductId,
  isSameProduct,
  isWellFormedProductId,
} from "@/utils/product-id";

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

// The same examples as the backend's CanonicalBarcodeTest, so the two ports cannot drift apart unnoticed.
describe("canonicalProductId", () => {
  it.each([
    ["0000054490970", "54490970"],
    ["0012345678905", "12345678905"],
    ["00012345678905", "12345678905"],
    [" 0012345678905 ", "12345678905"],
    ["024000011859", "24000011859"],
    ["0020000000000", "20000000000"],
    ["3856021300547", "3856021300547"],
  ])("strips %s to %s", (id, canonical) => {
    expect(canonicalProductId(id)).toBe(canonical);
    expect(canonicalProductId(canonical)).toBe(canonical);
  });

  it.each([
    "0212345678901",
    "0412345678903",
    "2012345678901",
    "212345678901",
    "02345673",
    "20123956",
    "00012345",
    "02012345678901",
    "konzum:0012345678905",
    "1234567",
    "00000000",
    "٠٠١٢٣٤٥٦٧٨٩٠٥",
  ])("leaves %s as sent", (id) => {
    expect(canonicalProductId(id)).toBe(id);
  });
});

describe("isSameProduct", () => {
  it("matches a padded and a bare spelling of one product", () => {
    expect(isSameProduct("0012345678905", "12345678905")).toBe(true);
  });

  it("keeps two paddings of an in-store code apart, as the backend does", () => {
    expect(isSameProduct("02345673", "002345673")).toBe(false);
  });

  it("matches nothing when either side is missing", () => {
    expect(isSameProduct(null, "12345678905")).toBe(false);
    expect(isSameProduct("12345678905", undefined)).toBe(false);
  });
});
