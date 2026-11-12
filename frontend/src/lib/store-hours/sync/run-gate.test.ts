import { describe, expect, it } from "vitest";

import { gateRun } from "@/lib/store-hours/sync/run-gate";

describe("gateRun", () => {
  it("accepts a first run and small changes", () => {
    expect(gateRun(120, null)).toBe("accepted");
    expect(gateRun(110, 120)).toBe("accepted");
    expect(gateRun(150, 120)).toBe("accepted");
  });

  it("rejects an empty run and a sharp drop", () => {
    expect(gateRun(0, null)).toBe("rejected");
    expect(gateRun(80, 120)).toBe("rejected");
  });
});
