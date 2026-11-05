import { describe, expect, it } from "vitest";

import { isGpuError } from "@/app/[locale]/map/utils/webgl-support";

describe("isGpuError", () => {
  it("recognises MapLibre's WebGL2 error by name", () => {
    const error = new Error("WebGL2 is required to display this map");
    error.name = "GPUInitializationError";

    expect(isGpuError(error)).toBe(true);
  });

  it("ignores other map errors, such as a failed tile", () => {
    expect(isGpuError(new Error("Failed to fetch"))).toBe(false);
    expect(isGpuError(undefined)).toBe(false);
  });
});
