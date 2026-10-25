import { describe, expect, it } from "vitest";
import { formatCroatianPhone } from "@/app/[locale]/map/utils/phone-format";

describe("formatCroatianPhone", () => {
  it.each([
    ["+385912345678", "091 234 5678"],
    ["+38512345678", "01 2345 678"],
    ["+38521123456", "021 123 456"],
    ["+385211234567", "021 123 4567"],
    ["+385800400000", "0800 400 000"],
    ["+38580012345", "0800 12 345"],
    ["+38560123456", "060 123 456"],
  ])("groups %s as %s", (input, expected) => {
    expect(formatCroatianPhone(input)).toBe(expected);
  });

  it("reads national input with separators", () => {
    expect(formatCroatianPhone("051/352-800")).toBe("051 352 800");
  });

  it("leaves foreign and unparseable numbers unchanged", () => {
    expect(formatCroatianPhone("+38761123456")).toBe("+38761123456");
    expect(formatCroatianPhone("12")).toBe("12");
  });
});
