import { expect, test } from "vitest";

test("fails on purpose to prove a red required check blocks the merge", () => {
  expect(1).toBe(2);
});
