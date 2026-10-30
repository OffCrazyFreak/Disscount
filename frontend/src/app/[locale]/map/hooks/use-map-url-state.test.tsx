import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const params = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => params.value }));

const { ALL_CHAINS, useMapUrlState } =
  await import("@/app/[locale]/map/hooks/use-map-url-state");

function chainFilterFor(query: string) {
  params.value = new URLSearchParams(query);
  return renderHook(() => useMapUrlState()).result.current.chainFilter;
}

describe("useMapUrlState chain filter", () => {
  it("leaves room for defaults until the user picks chains", () => {
    expect(chainFilterFor("")).toBeNull();
  });

  it("reads picked chains", () => {
    expect(chainFilterFor("chain=konzum,lidl")).toEqual(["konzum", "lidl"]);
  });

  it("treats an empty pick, as older links have, as every chain", () => {
    expect(chainFilterFor("chain=")).toBe(ALL_CHAINS);
    expect(chainFilterFor("chain=all")).toBe(ALL_CHAINS);
  });
});
