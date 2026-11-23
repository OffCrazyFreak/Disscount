import { afterEach, describe, expect, it, vi } from "vitest";

import { createExpiringKeySet } from "@/lib/expiring-key-set";

describe("createExpiringKeySet", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("remembers a key until its time runs out", () => {
    vi.useFakeTimers();
    const keys = createExpiringKeySet(1_000, 10);

    keys.add("a");
    expect(keys.has("a")).toBe(true);

    vi.advanceTimersByTime(1_000);
    expect(keys.has("a")).toBe(false);
  });

  it("forgets the oldest key past the limit", () => {
    const keys = createExpiringKeySet(60_000, 2);

    keys.add("a");
    keys.add("b");
    keys.add("a");
    keys.add("c");

    expect(keys.has("b")).toBe(false);
    expect(keys.has("a")).toBe(true);
    expect(keys.has("c")).toBe(true);
  });
});
