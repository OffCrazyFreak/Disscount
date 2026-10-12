import { describe, expect, it } from "vitest";
import {
  COLLECT_WINDOW_MS,
  createConsensusState,
  isRejecting,
  readyCodes,
  recordReads,
  requiredReads,
} from "@/components/scanner/scan-consensus";
import type { IScannedCode } from "@/typings/scanned-code";

const EAN: IScannedCode = { rawValue: "4006381333931", format: "ean_13" };
const OTHER: IScannedCode = { rawValue: "5901234123457", format: "ean_13" };
const BAD: IScannedCode = { rawValue: "4006381333932", format: "ean_13" };
const CODE_39: IScannedCode = { rawValue: "ABC123", format: "code_39" };

describe("requiredReads", () => {
  it("scales with preset and format", () => {
    expect(requiredReads("product", "ean_13")).toBe(2);
    expect(requiredReads("all", "ean_13")).toBe(3);
    expect(requiredReads("all", "code_128")).toBe(3);
    for (const format of ["code_39", "code_93", "codabar", "itf"]) {
      expect(requiredReads("all", format)).toBe(4);
    }
  });
});

describe("recordReads", () => {
  it("emits a product after two identical reads", () => {
    let state = recordReads(createConsensusState(), [EAN], 0, "product");
    expect(readyCodes(state, 0)).toBeNull();

    state = recordReads(state, [EAN], 400, "product");
    expect(readyCodes(state, 400)).toEqual([EAN]);
  });

  it("forgets reads older than 1.5 s", () => {
    let state = recordReads(createConsensusState(), [EAN], 0, "all");
    state = recordReads(state, [EAN], 800, "all");
    state = recordReads(state, [EAN], 1700, "all");
    expect(state.stable).toEqual([]);

    state = recordReads(state, [EAN], 2000, "all");
    expect(state.stable).toEqual([EAN]);
  });

  it("does not mix different values", () => {
    let state = createConsensusState();
    for (const [i, code] of [EAN, OTHER, EAN, OTHER].entries()) {
      state = recordReads(state, [code], i * 100, "all");
    }
    expect(state.stable).toEqual([]);
  });

  it("holds the all preset open for 800 ms to collect a second code", () => {
    let state = createConsensusState();
    for (const at of [0, 100, 200]) {
      state = recordReads(state, [EAN, OTHER], at, "all");
    }
    expect(state.stable).toEqual([EAN, OTHER]);
    expect(readyCodes(state, 900)).toBeNull();
    expect(readyCodes(state, 1000)).toEqual([EAN, OTHER]);
  });

  it("needs four reads for weak formats", () => {
    let state = createConsensusState();
    for (const at of [0, 200, 400]) {
      state = recordReads(state, [CODE_39], at, "all");
    }
    expect(state.stable).toEqual([]);

    state = recordReads(state, [CODE_39], 600, "all");
    expect(state.stable).toEqual([CODE_39]);
  });

  it("keeps a product's UPC-A as scanned", () => {
    const upc: IScannedCode = { rawValue: "036000291452", format: "upc_a" };
    const state = recordReads(createConsensusState(), [upc, upc], 0, "product");
    expect(readyCodes(state, 0)).toEqual([upc]);
  });

  it("normalises a card's UPC-A to EAN-13 before counting", () => {
    const upc: IScannedCode = { rawValue: "036000291452", format: "upc_a" };
    const state = recordReads(
      createConsensusState(),
      [upc, upc, upc],
      0,
      "all",
    );
    expect(readyCodes(state, COLLECT_WINDOW_MS)).toEqual([
      { rawValue: "0036000291452", format: "ean_13" },
    ]);
  });

  it("drops codes with a bad check digit and flags five seconds of rejects", () => {
    let state = createConsensusState();
    for (let at = 0; at <= 5000; at += 500) {
      state = recordReads(state, [BAD], at, "all");
    }

    expect(state.stable).toEqual([]);
    expect(isRejecting(state, 4000)).toBe(false);
    expect(isRejecting(state, 5000)).toBe(true);
    expect(isRejecting(state, 8000)).toBe(false);
  });

  it("restarts the reject clock after a pause", () => {
    let state = recordReads(createConsensusState(), [BAD], 0, "all");
    state = recordReads(state, [BAD], 4000, "all");
    state = recordReads(state, [BAD], 8500, "all");
    expect(isRejecting(state, 8500)).toBe(false);
  });
});
