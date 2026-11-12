import { describe, expect, it } from "vitest";

import { runExclusive } from "@/lib/offline/slot-lock";

describe("runExclusive", () => {
  it("runs tasks on the same key in order even when the first is slower", async () => {
    const order: string[] = [];

    const first = runExclusive("a", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push("first");
    });
    const second = runExclusive("a", async () => {
      order.push("second");
    });

    await Promise.all([first, second]);
    expect(order).toEqual(["first", "second"]);
  });

  it("does not block other keys", async () => {
    const order: string[] = [];

    const slow = runExclusive("a", async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      order.push("a");
    });
    const fast = runExclusive("b", async () => {
      order.push("b");
    });

    await Promise.all([slow, fast]);
    expect(order).toEqual(["b", "a"]);
  });

  it("keeps running after a task rejects and still reports the rejection", async () => {
    const failing = runExclusive("a", () => Promise.reject(new Error("x")));
    const next = runExclusive("a", async () => "ok");

    await expect(failing).rejects.toThrow("x");
    await expect(next).resolves.toBe("ok");
  });
});
