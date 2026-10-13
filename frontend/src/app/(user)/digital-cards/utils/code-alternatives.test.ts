import { describe, expect, it } from "vitest";

import { codeTypeAlternatives } from "@/app/(user)/digital-cards/utils/code-alternatives";

describe("codeTypeAlternatives", () => {
  it("offers EAN-13 first for a 13 digit value with a valid check digit", () => {
    expect(codeTypeAlternatives("5901234123457", "qr_code")).toEqual([
      "ean_13",
      "code_128",
      "code_39",
    ]);
  });

  it("drops EAN-13 when the check digit fails", () => {
    expect(codeTypeAlternatives("5901234123458", "code_128")).toEqual([
      "code_39",
      "qr_code",
    ]);
  });

  it("offers EAN-8 for a valid 8 digit value", () => {
    expect(codeTypeAlternatives("96385074", "code_128")).toEqual([
      "code_39",
      "qr_code",
      "ean_8",
    ]);
  });

  it("rotates after the current type and leaves it out", () => {
    expect(codeTypeAlternatives("12345", "code_128")).toEqual([
      "code_39",
      "qr_code",
    ]);
    expect(codeTypeAlternatives("12345", "qr_code")).toEqual([
      "code_128",
      "code_39",
    ]);
  });

  it("starts from the top when the current type cannot carry the value", () => {
    expect(codeTypeAlternatives("12345", "unknown")).toEqual([
      "code_128",
      "code_39",
      "qr_code",
    ]);
  });

  it("puts QR ahead of Code 39 for text", () => {
    expect(codeTypeAlternatives("AB-12", "unknown")).toEqual([
      "code_128",
      "qr_code",
      "code_39",
    ]);
  });

  it("skips Code 39 for lowercase and Code 128 for non-ASCII", () => {
    expect(codeTypeAlternatives("abc", "unknown")).toEqual([
      "code_128",
      "qr_code",
    ]);
    expect(codeTypeAlternatives("čaj", "unknown")).toEqual(["qr_code"]);
  });
});
